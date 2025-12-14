/**
 * LocalStorage 관련 유틸리티 함수
 * 서명 데이터를 브라우저 LocalStorage에 저장하고 조회합니다.
 */

import {
  Signature,
  ActivatedDate,
  AdminLog,
  ApproverSignature,
  MonthLock,
  PdfExportHistory,
} from '@/types'

const SIGNATURES_KEY = 'signatures'
const ACTIVATED_DATES_KEY = 'activated_dates'
const ADMIN_LOGS_KEY = 'admin_logs'
const APPROVER_SIGNATURES_KEY = 'approver_signatures'
const MONTH_LOCKS_KEY = 'month_locks'
const PDF_EXPORT_HISTORY_KEY = 'pdf_export_history'

/**
 * 서명 데이터를 LocalStorage에 저장
 */
export function saveSignature(signature: Signature): void {
  try {
    const signatures = getAllSignatures()
    signatures.push(signature)
    localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures))
  } catch (error) {
    console.error('서명 저장 실패:', error)
    throw new Error('서명을 저장하는 중 오류가 발생했습니다.')
  }
}

/**
 * LocalStorage에서 모든 서명 데이터 조회
 */
export function getAllSignatures(): Signature[] {
  try {
    const data = localStorage.getItem(SIGNATURES_KEY)
    if (!data) return []
    return JSON.parse(data) as Signature[]
  } catch (error) {
    console.error('서명 조회 실패:', error)
    return []
  }
}

/**
 * 특정 강사의 서명 목록 조회
 */
export function getSignaturesByInstructor(instructorId: string): Signature[] {
  const signatures = getAllSignatures()
  return signatures.filter((sig) => sig.instructorId === instructorId)
}

/**
 * 특정 강의의 서명 목록 조회
 */
export function getSignaturesByCourse(courseId: string): Signature[] {
  const signatures = getAllSignatures()
  return signatures.filter((sig) => sig.courseId === courseId)
}

/**
 * 특정 날짜의 서명 목록 조회
 */
export function getSignaturesByDate(date: string): Signature[] {
  const signatures = getAllSignatures()
  return signatures.filter((sig) => sig.date === date)
}

/**
 * 중복 서명 체크
 * 같은 강사, 같은 강의, 같은 날짜에 이미 서명이 있는지 확인
 *
 * 출근부 유형에 따라 중복 체크 방식이 다름:
 * - daily-multiple: 같은 시간 텍스트가 있으면 중복
 * - time-range: 시간 범위가 겹치면 중복
 * - class-period: 같은 교시면 중복
 */
export function checkDuplicateSignature(
  instructorId: string,
  courseId: string,
  date: string,
  attendanceType: string,
  additionalData?: {
    timeText?: string
    startTime?: string
    endTime?: string
    classPeriodId?: string
  }
): Signature | null {
  const signatures = getAllSignatures()

  // 같은 강사, 같은 강의, 같은 날짜의 서명 찾기
  const existingSignature = signatures.find((sig) => {
    if (
      sig.instructorId === instructorId &&
      sig.courseId === courseId &&
      sig.date === date &&
      sig.status !== 'invalidated' // 무효화된 서명은 제외
    ) {
      // 출근부 유형별 추가 체크
      if (attendanceType === 'daily-multiple') {
        // daily-multiple은 여러 번 서명 가능하므로 timeText가 같으면 중복
        return sig.timeText === additionalData?.timeText
      } else if (attendanceType === 'time-range') {
        // time-range는 여러 번 서명 가능하므로 시간이 겹치면 중복
        // 간단하게 정확히 같은 시간이면 중복으로 처리
        return (
          sig.startTime === additionalData?.startTime &&
          sig.endTime === additionalData?.endTime
        )
      } else if (attendanceType === 'class-period') {
        // class-period는 같은 교시면 중복
        return sig.classPeriodId === additionalData?.classPeriodId
      }
      return true // 기타 유형은 같은 날짜면 중복
    }
    return false
  })

  return existingSignature || null
}

/**
 * LocalStorage 초기화 (개발/테스트용)
 */
export function clearAllSignatures(): void {
  localStorage.removeItem(SIGNATURES_KEY)
}

// ============================================
// 날짜 활성화 관련 함수
// ============================================

/**
 * 활성화된 날짜 저장
 */
export function saveActivatedDate(activatedDate: ActivatedDate): void {
  try {
    const dates = getAllActivatedDates()
    dates.push(activatedDate)
    localStorage.setItem(ACTIVATED_DATES_KEY, JSON.stringify(dates))
  } catch (error) {
    console.error('활성화 날짜 저장 실패:', error)
    throw new Error('날짜 활성화 중 오류가 발생했습니다.')
  }
}

/**
 * 모든 활성화된 날짜 조회
 */
export function getAllActivatedDates(): ActivatedDate[] {
  try {
    const data = localStorage.getItem(ACTIVATED_DATES_KEY)
    if (!data) return []
    return JSON.parse(data) as ActivatedDate[]
  } catch (error) {
    console.error('활성화 날짜 조회 실패:', error)
    return []
  }
}

/**
 * 특정 강사/강의/날짜가 활성화되어 있는지 확인
 */
export function isDateActivated(
  instructorId: string,
  courseId: string,
  date: string
): boolean {
  const activatedDates = getAllActivatedDates()
  return activatedDates.some(
    (ad) =>
      ad.instructorId === instructorId &&
      ad.courseId === courseId &&
      ad.date === date
  )
}

/**
 * 강사의 활성화된 날짜 목록 조회
 */
export function getActivatedDatesByInstructor(
  instructorId: string
): ActivatedDate[] {
  const dates = getAllActivatedDates()
  return dates.filter((d) => d.instructorId === instructorId)
}

// ============================================
// 서명 무효화 관련 함수
// ============================================

/**
 * 서명 무효화
 */
export function invalidateSignature(signatureId: string): void {
  try {
    const signatures = getAllSignatures()
    const index = signatures.findIndex((s) => s.id === signatureId)
    if (index !== -1) {
      signatures[index].status = 'invalidated'
      localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures))
    }
  } catch (error) {
    console.error('서명 무효화 실패:', error)
    throw new Error('서명 무효화 중 오류가 발생했습니다.')
  }
}

// ============================================
// 관리자 행위 로그 관련 함수
// ============================================

/**
 * 관리자 행위 로그 저장
 */
export function saveAdminLog(log: AdminLog): void {
  try {
    const logs = getAllAdminLogs()
    logs.push(log)
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(logs))
  } catch (error) {
    console.error('로그 저장 실패:', error)
  }
}

/**
 * 모든 관리자 행위 로그 조회
 */
export function getAllAdminLogs(): AdminLog[] {
  try {
    const data = localStorage.getItem(ADMIN_LOGS_KEY)
    if (!data) return []
    return JSON.parse(data) as AdminLog[]
  } catch (error) {
    console.error('로그 조회 실패:', error)
    return []
  }
}

// ============================================
// 확인자 서명 관련 함수
// ============================================

/**
 * 확인자 서명 저장
 */
export function saveApproverSignature(signature: ApproverSignature): void {
  try {
    const signatures = getAllApproverSignatures()
    signatures.push(signature)
    localStorage.setItem(APPROVER_SIGNATURES_KEY, JSON.stringify(signatures))
  } catch (error) {
    console.error('확인자 서명 저장 실패:', error)
    throw new Error('확인자 서명 저장 중 오류가 발생했습니다.')
  }
}

/**
 * 모든 확인자 서명 조회
 */
export function getAllApproverSignatures(): ApproverSignature[] {
  try {
    const data = localStorage.getItem(APPROVER_SIGNATURES_KEY)
    if (!data) return []
    return JSON.parse(data) as ApproverSignature[]
  } catch (error) {
    console.error('확인자 서명 조회 실패:', error)
    return []
  }
}

/**
 * 특정 월의 확인자 서명 조회
 */
export function getApproverSignatureByMonth(
  month: string
): ApproverSignature | null {
  const signatures = getAllApproverSignatures()
  return signatures.find((s) => s.month === month) || null
}

// ============================================
// 월 마감 관련 함수
// ============================================

/**
 * 월 마감 저장
 */
export function saveMonthLock(lock: MonthLock): void {
  try {
    const locks = getAllMonthLocks()
    // 같은 월에 대한 기존 마감이 있으면 제거 (덮어쓰기)
    const filtered = locks.filter((l) => l.month !== lock.month)
    filtered.push(lock)
    localStorage.setItem(MONTH_LOCKS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('월 마감 저장 실패:', error)
    throw new Error('월 마감 중 오류가 발생했습니다.')
  }
}

/**
 * 모든 월 마감 조회
 */
export function getAllMonthLocks(): MonthLock[] {
  try {
    const data = localStorage.getItem(MONTH_LOCKS_KEY)
    if (!data) return []
    return JSON.parse(data) as MonthLock[]
  } catch (error) {
    console.error('월 마감 조회 실패:', error)
    return []
  }
}

/**
 * 특정 월 마감 여부 확인
 */
export function isMonthLocked(month: string): boolean {
  const locks = getAllMonthLocks()
  return locks.some((l) => l.month === month)
}

/**
 * 특정 월 마감 정보 조회
 */
export function getMonthLock(month: string): MonthLock | null {
  const locks = getAllMonthLocks()
  return locks.find((l) => l.month === month) || null
}

/**
 * 월 마감 해제 (슈퍼 관리자 전용)
 */
export function unlockMonth(month: string): void {
  try {
    const locks = getAllMonthLocks()
    const filtered = locks.filter((l) => l.month !== month)
    localStorage.setItem(MONTH_LOCKS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('월 마감 해제 실패:', error)
    throw new Error('월 마감 해제 중 오류가 발생했습니다.')
  }
}

/**
 * 특정 날짜가 속한 월 구하기 (YYYY-MM-DD -> YYYY-MM)
 */
export function getMonthFromDate(date: string): string {
  return date.substring(0, 7) // YYYY-MM-DD -> YYYY-MM
}

// ============================================
// PDF 출력 이력 관련 함수
// ============================================

/**
 * PDF 출력 이력 저장
 */
export function savePdfExportHistory(history: PdfExportHistory): void {
  try {
    const histories = getAllPdfExportHistories()
    histories.push(history)
    localStorage.setItem(PDF_EXPORT_HISTORY_KEY, JSON.stringify(histories))
  } catch (error) {
    console.error('PDF 출력 이력 저장 실패:', error)
    throw new Error('PDF 출력 이력 저장 중 오류가 발생했습니다.')
  }
}

/**
 * 모든 PDF 출력 이력 조회
 */
export function getAllPdfExportHistories(): PdfExportHistory[] {
  try {
    const data = localStorage.getItem(PDF_EXPORT_HISTORY_KEY)
    if (!data) return []
    return JSON.parse(data) as PdfExportHistory[]
  } catch (error) {
    console.error('PDF 출력 이력 조회 실패:', error)
    return []
  }
}

/**
 * 특정 월의 PDF 출력 이력 조회
 */
export function getPdfExportHistoriesByMonth(
  month: string
): PdfExportHistory[] {
  const histories = getAllPdfExportHistories()
  return histories.filter((h) => h.month === month)
}
