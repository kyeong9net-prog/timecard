import React, { useState, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { getAllPdfExportHistories } from '@/lib/storage-utils'
import { formatTimestamp } from '@/lib/time-utils'

export default function ExportHistoryPage() {
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  // 전체 출력 이력
  const allHistories = useMemo(() => {
    return getAllPdfExportHistories().sort(
      (a, b) =>
        new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime()
    )
  }, [])

  // 필터링된 출력 이력
  const filteredHistories = useMemo(() => {
    return allHistories.filter((history) => {
      if (filterMonth && history.month !== filterMonth) return false
      if (filterType && history.exportType !== filterType) return false
      return true
    })
  }, [allHistories, filterMonth, filterType])

  const handleReset = () => {
    setFilterMonth('')
    setFilterType('')
  }

  return (
    <AdminLayout title="PDF 출력 이력">
      <div className="max-w-7xl mx-auto">
        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">전체 출력 건수</p>
            <p className="text-3xl font-bold text-gray-900">
              {allHistories.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">강사별 출력</p>
            <p className="text-3xl font-bold text-gray-900">
              {allHistories.filter((h) => h.exportType === 'instructor').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">강의별 출력</p>
            <p className="text-3xl font-bold text-gray-900">
              {allHistories.filter((h) => h.exportType === 'course').length}
            </p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">필터</h2>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              초기화
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대상 월
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출력 유형
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="instructor">강사별</option>
                <option value="course">강의별</option>
              </select>
            </div>
          </div>
        </div>

        {/* 출력 이력 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              출력 이력 ({filteredHistories.length}건)
            </h2>
          </div>

          {filteredHistories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">출력 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      출력 시각
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      대상
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      월
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      서명 건수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      출력자
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistories.map((history) => (
                    <tr
                      key={history.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(history.exportedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            history.exportType === 'instructor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {history.exportType === 'instructor'
                            ? '강사별'
                            : '강의별'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {history.targetName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.signatureCount}건
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.exportedByName}
                      </td>
                    </tr>
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
