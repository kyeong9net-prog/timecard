/**
 * 데이터 변경 이력 조회 페이지 (Phase 9)
 */

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { DataChangeLog, DataChangeActionType, DataTargetType } from '@/types'
import {
  getAllDataLogs,
  sortLogsByNewest,
  filterLogsByActionType,
  filterLogsByTargetType,
  filterLogsByDateRange,
} from '@/lib/data-log-utils'

export default function DataLogsPage() {
  const [logs, setLogs] = useState<DataChangeLog[]>([])
  const [displayLogs, setDisplayLogs] = useState<DataChangeLog[]>([])
  const [actionTypeFilter, setActionTypeFilter] = useState<
    DataChangeActionType | 'all'
  >('all')
  const [targetTypeFilter, setTargetTypeFilter] = useState<
    DataTargetType | 'all'
  >('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    let filtered = logs

    // 행위 유형 필터
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter((log) => log.actionType === actionTypeFilter)
    }

    // 대상 유형 필터
    if (targetTypeFilter !== 'all') {
      filtered = filtered.filter((log) => log.targetType === targetTypeFilter)
    }

    // 날짜 범위 필터
    if (startDate && endDate) {
      filtered = filterLogsByDateRange(startDate, endDate).filter((log) =>
        filtered.some((f) => f.id === log.id)
      )
    }

    // 검색 필터 (관리자명, 대상명)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.adminName.toLowerCase().includes(query) ||
          log.targetName.toLowerCase().includes(query)
      )
    }

    setDisplayLogs(filtered)
  }, [logs, actionTypeFilter, targetTypeFilter, startDate, endDate, searchQuery])

  const loadLogs = () => {
    const allLogs = getAllDataLogs()
    const sorted = sortLogsByNewest(allLogs)
    setLogs(sorted)
  }

  const handleResetFilters = () => {
    setActionTypeFilter('all')
    setTargetTypeFilter('all')
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
  }

  const toggleLogDetails = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId)
  }

  const getActionTypeLabel = (actionType: DataChangeActionType): string => {
    const labels: Record<DataChangeActionType, string> = {
      create_instructor: '강사 생성',
      update_instructor: '강사 수정',
      deactivate_instructor: '강사 비활성화',
      create_course: '강의 생성',
      update_course: '강의 수정',
      deactivate_course: '강의 비활성화',
      add_course_mapping: '강의 배정',
      remove_course_mapping: '강의 배정 해제',
    }
    return labels[actionType] || actionType
  }

  const getTargetTypeLabel = (targetType: DataTargetType): string => {
    const labels: Record<DataTargetType, string> = {
      instructor: '강사',
      course: '강의',
      mapping: '배정',
    }
    return labels[targetType] || targetType
  }

  const formatTimestamp = (timestamp: string): string => {
    return timestamp.replace('T', ' ').substring(0, 19)
  }

  return (
    <AdminLayout title="데이터 변경 이력">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">데이터 변경 이력</h1>
          <p className="mt-2 text-gray-600">
            마스터 데이터(강사, 강의, 배정)의 모든 변경 이력을 조회합니다.
          </p>
        </div>

        {/* 필터 영역 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                행위 유형
              </label>
              <select
                value={actionTypeFilter}
                onChange={(e) =>
                  setActionTypeFilter(
                    e.target.value as DataChangeActionType | 'all'
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="create_instructor">강사 생성</option>
                <option value="update_instructor">강사 수정</option>
                <option value="deactivate_instructor">강사 비활성화</option>
                <option value="create_course">강의 생성</option>
                <option value="update_course">강의 수정</option>
                <option value="deactivate_course">강의 비활성화</option>
                <option value="add_course_mapping">강의 배정</option>
                <option value="remove_course_mapping">강의 배정 해제</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                대상 유형
              </label>
              <select
                value={targetTypeFilter}
                onChange={(e) =>
                  setTargetTypeFilter(e.target.value as DataTargetType | 'all')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="instructor">강사</option>
                <option value="course">강의</option>
                <option value="mapping">배정</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                placeholder="관리자명 또는 대상명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                시작 날짜
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                종료 날짜
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            총 {displayLogs.length}건의 이력이 있습니다.
          </div>
        </div>

        {/* 이력 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {displayLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {logs.length === 0
                ? '변경 이력이 없습니다.'
                : '검색 결과가 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      일시
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      행위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      대상 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      대상명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상세
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.adminName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getActionTypeLabel(log.actionType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTargetTypeLabel(log.targetType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.targetName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(log.beforeValue || log.afterValue) && (
                            <button
                              onClick={() => toggleLogDetails(log.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {expandedLogId === log.id ? '접기' : '펼치기'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedLogId === log.id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-2 gap-4">
                              {log.beforeValue && (
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">
                                    변경 전
                                  </h4>
                                  <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto">
                                    {JSON.stringify(log.beforeValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.afterValue && (
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">
                                    변경 후
                                  </h4>
                                  <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto">
                                    {JSON.stringify(log.afterValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                            {log.reason && (
                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-700 mb-2">
                                  사유
                                </h4>
                                <p className="text-sm text-gray-900">
                                  {log.reason}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
