/**
 * 데이터 변경 이력 로그 유틸리티 함수 (Phase 9)
 * LocalStorage를 사용한 마스터 데이터 변경 이력 관리
 */

import {
  DataChangeLog,
  DataChangeActionType,
  DataTargetType,
} from '@/types'
import { getCurrentTimestampKST } from './time-utils'

const DATA_LOGS_KEY = 'data-change-logs'

/**
 * 모든 데이터 변경 로그 조회
 */
export function getAllDataLogs(): DataChangeLog[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(DATA_LOGS_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * 데이터 변경 로그 기록
 */
export function logDataChange(params: {
  adminId: string
  adminName: string
  actionType: DataChangeActionType
  targetType: DataTargetType
  targetId: string
  targetName: string
  beforeValue?: any
  afterValue?: any
  reason?: string
}): void {
  const logs = getAllDataLogs()

  const newLog: DataChangeLog = {
    id: `datalog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: getCurrentTimestampKST(),
    adminId: params.adminId,
    adminName: params.adminName,
    actionType: params.actionType,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName,
    beforeValue: params.beforeValue,
    afterValue: params.afterValue,
    reason: params.reason,
  }

  logs.push(newLog)
  localStorage.setItem(DATA_LOGS_KEY, JSON.stringify(logs))
}

/**
 * 행위 유형으로 필터링
 */
export function filterLogsByActionType(
  actionType: DataChangeActionType | 'all'
): DataChangeLog[] {
  const logs = getAllDataLogs()

  if (actionType === 'all') return logs
  return logs.filter((log) => log.actionType === actionType)
}

/**
 * 대상 유형으로 필터링
 */
export function filterLogsByTargetType(
  targetType: DataTargetType | 'all'
): DataChangeLog[] {
  const logs = getAllDataLogs()

  if (targetType === 'all') return logs
  return logs.filter((log) => log.targetType === targetType)
}

/**
 * 날짜 범위로 필터링
 */
export function filterLogsByDateRange(
  startDate: string,
  endDate: string
): DataChangeLog[] {
  const logs = getAllDataLogs()

  return logs.filter((log) => {
    const logDate = log.timestamp.substring(0, 10) // YYYY-MM-DD 추출
    return logDate >= startDate && logDate <= endDate
  })
}

/**
 * 관리자별 필터링
 */
export function filterLogsByAdmin(adminId: string): DataChangeLog[] {
  const logs = getAllDataLogs()
  return logs.filter((log) => log.adminId === adminId)
}

/**
 * 특정 대상의 변경 이력 조회
 */
export function getLogsByTarget(
  targetType: DataTargetType,
  targetId: string
): DataChangeLog[] {
  const logs = getAllDataLogs()
  return logs.filter(
    (log) => log.targetType === targetType && log.targetId === targetId
  )
}

/**
 * 로그를 최신순으로 정렬
 */
export function sortLogsByNewest(logs: DataChangeLog[]): DataChangeLog[] {
  return [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
