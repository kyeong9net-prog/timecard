import React, { useState, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { getAllAdminLogs } from '@/lib/storage-utils'
import { AdminLog, AdminActionType } from '@/types'
import { formatTimestamp } from '@/lib/time-utils'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>(() => getAllAdminLogs())
  const [filterAction, setFilterAction] = useState<AdminActionType | ''>('')
  const [filterAdmin, setFilterAdmin] = useState<string>('')
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null)

  // 필터링된 로그 목록
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterAction && log.action !== filterAction) {
        return false
      }
      if (filterAdmin && !log.adminName.includes(filterAdmin)) {
        return false
      }
      return true
    })
  }, [logs, filterAction, filterAdmin])

  // 고유한 관리자 목록
  const uniqueAdmins = useMemo(() => {
    const adminNames = new Set(logs.map((log) => log.adminName))
    return Array.from(adminNames)
  }, [logs])

  const handleReset = () => {
    setFilterAction('')
    setFilterAdmin('')
  }

  const handleRefresh = () => {
    setLogs(getAllAdminLogs())
  }

  const getActionLabel = (action: AdminActionType): string => {
    switch (action) {
      case 'activate_date':
        return '날짜 활성화'
      case 'invalidate_signature':
        return '서명 무효화'
      case 'login':
        return '로그인'
      case 'logout':
        return '로그아웃'
      default:
        return action
    }
  }

  const getActionColor = (action: AdminActionType): string => {
    switch (action) {
      case 'activate_date':
        return 'bg-green-100 text-green-800'
      case 'invalidate_signature':
        return 'bg-red-100 text-red-800'
      case 'login':
        return 'bg-blue-100 text-blue-800'
      case 'logout':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout title="관리자 행위 로그">
      <div className="max-w-7xl mx-auto">
        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">필터</h2>
            <div className="space-x-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                행위 유형
              </label>
              <select
                value={filterAction}
                onChange={(e) =>
                  setFilterAction(e.target.value as AdminActionType | '')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="activate_date">날짜 활성화</option>
                <option value="invalidate_signature">서명 무효화</option>
                <option value="login">로그인</option>
                <option value="logout">로그아웃</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관리자
              </label>
              <select
                value={filterAdmin}
                onChange={(e) => setFilterAdmin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {uniqueAdmins.map((adminName) => (
                  <option key={adminName} value={adminName}>
                    {adminName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 로그 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              로그 기록 ({filteredLogs.length}건)
            </h2>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">로그 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시각
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      행위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      대상
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상세
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.adminName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(
                            log.action
                          )}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.targetName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  로그 상세 정보
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">관리자</p>
                    <p className="font-medium text-gray-900">
                      {selectedLog.adminName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">행위 유형</p>
                    <p className="font-medium text-gray-900">
                      {getActionLabel(selectedLog.action)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">시각</p>
                    <p className="font-medium text-gray-900">
                      {formatTimestamp(selectedLog.timestamp)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">대상 유형</p>
                    <p className="font-medium text-gray-900">
                      {selectedLog.targetType || '-'}
                    </p>
                  </div>
                </div>

                {selectedLog.targetName && (
                  <div>
                    <p className="text-sm text-gray-600">대상</p>
                    <p className="font-medium text-gray-900">
                      {selectedLog.targetName}
                    </p>
                  </div>
                )}

                {selectedLog.reason && (
                  <div>
                    <p className="text-sm text-gray-600">사유</p>
                    <p className="font-medium text-gray-900">
                      {selectedLog.reason}
                    </p>
                  </div>
                )}

                {selectedLog.details && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">상세 정보</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
