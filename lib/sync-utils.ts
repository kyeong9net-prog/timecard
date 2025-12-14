/**
 * 동기화 로직 유틸리티
 * 오프라인 서명을 온라인 저장소로 동기화합니다.
 */

import { Signature, SyncConflict } from '@/types'
import {
  getOfflineSignatures,
  removeOfflineSignature,
  updateOfflineSignatureStatus,
} from './offline-storage-utils'
import {
  getAllSignatures,
  saveSignature,
  checkDuplicateSignature,
  isMonthLocked,
  getMonthFromDate,
} from './storage-utils'

const SYNC_CONFLICTS_KEY = 'sync_conflicts'

/**
 * 동기화 결과 타입
 */
export interface SyncResult {
  total: number // 총 시도 건수
  success: number // 성공 건수
  failed: number // 실패 건수
  conflicts: number // 충돌 건수
}

/**
 * 오프라인 서명을 온라인 저장소로 동기화
 */
export async function syncOfflineSignatures(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0,
    success: 0,
    failed: 0,
    conflicts: 0,
  }

  const offlineSignatures = getOfflineSignatures().filter(
    (sig) => sig.syncStatus === 'pending'
  )

  result.total = offlineSignatures.length

  if (result.total === 0) {
    return result
  }

  // 순차 처리
  for (const signature of offlineSignatures) {
    try {
      // 검증
      const validationResult = validateSignatureForSync(signature)

      if (!validationResult.valid) {
        // 충돌 발생: 로그 기록 후 제거
        saveSyncConflict({
          id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          offlineSignatureId: signature.id,
          conflictType: validationResult.conflictType!,
          instructorId: signature.instructorId,
          instructorName: signature.instructorName,
          courseId: signature.courseId,
          courseName: signature.courseName,
          date: signature.date,
          timestamp: new Date().toISOString(),
          reason: validationResult.reason!,
          offlineSignatureData: signature,
        })

        result.conflicts++
        removeOfflineSignature(signature.id)
        continue
      }

      // 동기화 시도 (재시도 로직 포함)
      const syncSuccess = await syncSingleSignature(signature)

      if (syncSuccess) {
        result.success++
        removeOfflineSignature(signature.id)
      } else {
        result.failed++
        updateOfflineSignatureStatus(signature.id, 'failed')
      }
    } catch (error) {
      console.error('동기화 오류:', error)
      result.failed++
      updateOfflineSignatureStatus(signature.id, 'failed')
    }
  }

  return result
}

/**
 * 단일 서명 동기화 (재시도 로직 포함)
 */
async function syncSingleSignature(
  signature: Signature,
  retryCount = 0
): Promise<boolean> {
  const MAX_RETRIES = 3
  const RETRY_DELAYS = [1000, 2000, 4000] // 지수 백오프

  try {
    // syncStatus 제거 후 저장
    const { syncStatus, ...cleanSignature } = signature
    saveSignature(cleanSignature as Signature)
    return true
  } catch (error) {
    console.error('서명 동기화 실패:', error)

    // 재시도
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAYS[retryCount])
      return syncSingleSignature(signature, retryCount + 1)
    }

    return false
  }
}

/**
 * 동기화 전 검증
 */
function validateSignatureForSync(signature: Signature): {
  valid: boolean
  conflictType?: 'duplicate' | 'month_locked'
  reason?: string
} {
  // 1. 월 마감 체크
  const targetMonth = getMonthFromDate(signature.date)
  if (isMonthLocked(targetMonth)) {
    return {
      valid: false,
      conflictType: 'month_locked',
      reason: `${targetMonth} 월은 이미 마감되어 동기화할 수 없습니다.`,
    }
  }

  // 2. 중복 서명 체크
  const additionalData: {
    timeText?: string
    startTime?: string
    endTime?: string
    classPeriodId?: string
  } = {}

  if (signature.timeText) additionalData.timeText = signature.timeText
  if (signature.startTime) additionalData.startTime = signature.startTime
  if (signature.endTime) additionalData.endTime = signature.endTime
  if (signature.classPeriodId)
    additionalData.classPeriodId = signature.classPeriodId

  const duplicate = checkDuplicateSignature(
    signature.instructorId,
    signature.courseId,
    signature.date,
    'daily-multiple', // 간단하게 처리 (실제로는 출근부 유형도 저장 필요)
    additionalData
  )

  if (duplicate) {
    return {
      valid: false,
      conflictType: 'duplicate',
      reason: '이미 동일한 서명이 존재합니다.',
    }
  }

  return { valid: true }
}

/**
 * 동기화 충돌 저장
 */
export function saveSyncConflict(conflict: SyncConflict): void {
  try {
    const conflicts = getAllSyncConflicts()
    conflicts.push(conflict)
    localStorage.setItem(SYNC_CONFLICTS_KEY, JSON.stringify(conflicts))
  } catch (error) {
    console.error('충돌 로그 저장 실패:', error)
  }
}

/**
 * 모든 동기화 충돌 조회
 */
export function getAllSyncConflicts(): SyncConflict[] {
  try {
    const data = localStorage.getItem(SYNC_CONFLICTS_KEY)
    if (!data) return []
    return JSON.parse(data) as SyncConflict[]
  } catch (error) {
    console.error('충돌 로그 조회 실패:', error)
    return []
  }
}

/**
 * 지연 함수 (재시도용)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
