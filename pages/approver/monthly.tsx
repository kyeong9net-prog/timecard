import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import {
  getAllSignatures,
  getApproverSignatureByMonth,
  getMonthLock,
  isMonthLocked,
} from '@/lib/storage-utils'
import { Signature } from '@/types'
import { formatTimestamp, getCurrentDateKST } from '@/lib/time-utils'
import { mockInstructors } from '@/data'
import { useAuth } from '@/contexts/AuthContext'

export default function ApproverMonthlyPage() {
  const router = useRouter()
  const { admin, isAuthenticated } = useAuth()

  // 현재 월을 기본값으로 설정
  const currentMonth = getCurrentDateKST().substring(0, 7) // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(
    null
  )

  // 확인자가 아니면 접근 불가
  useEffect(() => {
    if (isAuthenticated && admin && admin.role !== 'approver') {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, admin, router])

  // 해당 월의 서명 목록 조회
  const monthSignatures = useMemo(() => {
    const allSignatures = getAllSignatures()
    return allSignatures.filter((sig) => sig.date.startsWith(selectedMonth))
  }, [selectedMonth])

  // 강사별 요약 통계
  const instructorStats = useMemo(() => {
    const stats = new Map<
      string,
      { instructorId: string; name: string; totalDays: number; signedDays: number }
    >()

    monthSignatures.forEach((sig) => {
      if (!stats.has(sig.instructorId)) {
        stats.set(sig.instructorId, {
          instructorId: sig.instructorId,
          name: sig.instructorName,
          totalDays: 0,
          signedDays: 0,
        })
      }
      const stat = stats.get(sig.instructorId)!
      stat.signedDays++
    })

    // 해당 월의 총 일수 계산 (간단하게 서명이 있는 일수로 계산)
    stats.forEach((stat) => {
      const instructorSignatures = monthSignatures.filter(
        (s) => s.instructorId === stat.instructorId
      )
      const uniqueDates = new Set(instructorSignatures.map((s) => s.date))
      stat.totalDays = uniqueDates.size
    })

    return Array.from(stats.values())
  }, [monthSignatures])

  // 월 마감 정보
  const monthLock = getMonthLock(selectedMonth)
  const isLocked = isMonthLocked(selectedMonth)

  // 확인자 서명 정보
  const approverSignature = getApproverSignatureByMonth(selectedMonth)

  return (
    <AdminLayout title="월별 출근부 조회">
      <div className="max-w-7xl mx-auto">
        {/* 월 선택 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">조회 월 선택</h2>
            {isLocked && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                  🔒 마감됨
                </span>
                {monthLock && (
                  <span className="text-sm text-gray-600">
                    {monthLock.lockedByName} ({formatTimestamp(monthLock.lockedAt).split(' ')[0]})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 강사별 요약 통계 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            강사별 서명 현황
          </h2>

          {instructorStats.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              해당 월에 서명 기록이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructorStats.map((stat) => (
                <div
                  key={stat.instructorId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {stat.name}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">서명 일수:</span>
                      <span className="font-medium text-gray-900">
                        {stat.signedDays}일
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 서명 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              서명 기록 ({monthSignatures.length}건)
            </h2>
          </div>

          {monthSignatures.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">서명 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      강사
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      강의
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      서명 시각
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상세
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthSignatures.map((signature) => (
                    <tr
                      key={signature.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {signature.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {signature.instructorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {signature.courseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatTimestamp(signature.timestamp).split(' ')[1]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            signature.status === 'normal'
                              ? 'bg-green-100 text-green-800'
                              : signature.status === 'activated'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {signature.status === 'normal'
                            ? '정상'
                            : signature.status === 'activated'
                            ? '활성화'
                            : '무효화'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedSignature(signature)}
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

        {/* 확인자 서명 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            확인자 서명
          </h2>

          {approverSignature ? (
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">확인자: {approverSignature.approverName}</p>
                  <p className="text-sm text-gray-600">
                    서명 시각: {formatTimestamp(approverSignature.timestamp)}
                  </p>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={approverSignature.imageData}
                alt="확인자 서명"
                className="max-w-xs h-auto border border-gray-300 rounded"
              />
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">아직 확인자 서명이 없습니다.</p>
              {!isLocked && (
                <p className="text-sm text-gray-400 mt-2">
                  아래에서 서명하고 마감할 수 있습니다.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 서명 상세 모달 */}
      {selectedSignature && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSignature(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  서명 상세 정보
                </h3>
                <button
                  onClick={() => setSelectedSignature(null)}
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
                    <p className="text-sm text-gray-600">강사</p>
                    <p className="font-medium text-gray-900">
                      {selectedSignature.instructorName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">강의</p>
                    <p className="font-medium text-gray-900">
                      {selectedSignature.courseName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">날짜</p>
                    <p className="font-medium text-gray-900">
                      {selectedSignature.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">서명 시각</p>
                    <p className="font-medium text-gray-900">
                      {formatTimestamp(selectedSignature.timestamp)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">상태</p>
                    <p className="font-medium text-gray-900">
                      {selectedSignature.status === 'normal'
                        ? '정상'
                        : selectedSignature.status === 'activated'
                        ? '활성화 후 서명'
                        : '무효화'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">서명 이미지</p>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedSignature.imageData}
                      alt="서명"
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSignature(null)}
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
