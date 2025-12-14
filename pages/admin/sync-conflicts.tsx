/**
 * 동기화 충돌 로그 조회 페이지
 * 관리자가 오프라인 서명 동기화 충돌 내역을 확인할 수 있습니다.
 */

import React, { useState, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { getAllSyncConflicts } from '@/lib/sync-utils'
import { formatTimestamp } from '@/lib/time-utils'
import { SyncConflict } from '@/types'

export default function SyncConflictsPage() {
  const [filterType, setFilterType] = useState<string>('')
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null)

  // 전체 충돌 목록
  const allConflicts = useMemo(() => {
    return getAllSyncConflicts().sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [])

  // 필터링된 충돌 목록
  const filteredConflicts = useMemo(() => {
    return allConflicts.filter((conflict) => {
      if (filterType && conflict.conflictType !== filterType) return false
      return true
    })
  }, [allConflicts, filterType])

  const handleReset = () => {
    setFilterType('')
  }

  return (
    <AdminLayout title="동기화 충돌 로그">
      <div className="max-w-7xl mx-auto">
        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">전체 충돌 건수</p>
            <p className="text-3xl font-bold text-gray-900">
              {allConflicts.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">중복 충돌</p>
            <p className="text-3xl font-bold text-gray-900">
              {allConflicts.filter((c) => c.conflictType === 'duplicate').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">월 마감 충돌</p>
            <p className="text-3xl font-bold text-gray-900">
              {allConflicts.filter((c) => c.conflictType === 'month_locked').length}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              충돌 유형
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체</option>
              <option value="duplicate">중복 서명</option>
              <option value="month_locked">월 마감</option>
            </select>
          </div>
        </div>

        {/* 충돌 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              충돌 목록 ({filteredConflicts.length}건)
            </h2>
          </div>

          {filteredConflicts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">충돌 로그가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      충돌 시각
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      강사
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      강의
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사유
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상세
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConflicts.map((conflict) => (
                    <tr
                      key={conflict.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(conflict.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            conflict.conflictType === 'duplicate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {conflict.conflictType === 'duplicate'
                            ? '중복 서명'
                            : '월 마감'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {conflict.instructorName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {conflict.courseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conflict.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {conflict.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedConflict(conflict)}
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

      {/* 충돌 상세 모달 */}
      {selectedConflict && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedConflict(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              충돌 상세 정보
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">충돌 유형</p>
                <p className="text-gray-900">
                  {selectedConflict.conflictType === 'duplicate'
                    ? '중복 서명'
                    : '월 마감'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">강사</p>
                <p className="text-gray-900">{selectedConflict.instructorName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">강의</p>
                <p className="text-gray-900">{selectedConflict.courseName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">날짜</p>
                <p className="text-gray-900">{selectedConflict.date}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">충돌 시각</p>
                <p className="text-gray-900">
                  {formatTimestamp(selectedConflict.timestamp)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">사유</p>
                <p className="text-gray-900">{selectedConflict.reason}</p>
              </div>
              {selectedConflict.offlineSignatureData && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    무시된 오프라인 서명
                  </p>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-600">
                      서명 ID: {selectedConflict.offlineSignatureData.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      서명 시각:{' '}
                      {formatTimestamp(selectedConflict.offlineSignatureData.timestamp)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedConflict(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
