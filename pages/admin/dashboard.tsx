import React, { useState, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { getAllSignatures } from '@/lib/storage-utils'
import { mockInstructors, mockCourses } from '@/data'
import { Signature } from '@/types'
import { formatTimestamp } from '@/lib/time-utils'

export default function AdminDashboardPage() {
  const [signatures, setSignatures] = useState<Signature[]>(() =>
    getAllSignatures()
  )
  const [filterInstructor, setFilterInstructor] = useState<string>('')
  const [filterCourse, setFilterCourse] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(
    null
  )

  // 필터링된 서명 목록
  const filteredSignatures = useMemo(() => {
    return signatures.filter((sig) => {
      if (filterInstructor && sig.instructorId !== filterInstructor) {
        return false
      }
      if (filterCourse && sig.courseId !== filterCourse) {
        return false
      }
      if (filterMonth) {
        const sigMonth = sig.date.substring(0, 7) // YYYY-MM
        if (sigMonth !== filterMonth) {
          return false
        }
      }
      return true
    })
  }, [signatures, filterInstructor, filterCourse, filterMonth])

  // 통계 계산
  const stats = useMemo(() => {
    return {
      total: filteredSignatures.length,
      normal: filteredSignatures.filter((s) => s.status === 'normal').length,
      activated: filteredSignatures.filter((s) => s.status === 'activated')
        .length,
      invalidated: filteredSignatures.filter((s) => s.status === 'invalidated')
        .length,
    }
  }, [filteredSignatures])

  const handleReset = () => {
    setFilterInstructor('')
    setFilterCourse('')
    setFilterMonth('')
  }

  const handleRefresh = () => {
    setSignatures(getAllSignatures())
  }

  return (
    <AdminLayout title="서명 현황 조회">
      <div className="max-w-7xl mx-auto">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">전체 서명</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">정상 서명</p>
            <p className="text-3xl font-bold text-green-600">{stats.normal}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">활성화 후 서명</p>
            <p className="text-3xl font-bold text-orange-600">
              {stats.activated}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">무효화된 서명</p>
            <p className="text-3xl font-bold text-gray-600">
              {stats.invalidated}
            </p>
          </div>
        </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강사
              </label>
              <select
                value={filterInstructor}
                onChange={(e) => setFilterInstructor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {mockInstructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의
              </label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {mockCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                월
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 서명 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              서명 기록 ({filteredSignatures.length}건)
            </h2>
          </div>

          {filteredSignatures.length === 0 ? (
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
                  {filteredSignatures.map((signature) => (
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
      </div>

      {/* 상세 정보 모달 */}
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
                  {selectedSignature.timeText && (
                    <div>
                      <p className="text-sm text-gray-600">시간 정보</p>
                      <p className="font-medium text-gray-900">
                        {selectedSignature.timeText}
                      </p>
                    </div>
                  )}
                  {selectedSignature.startTime && selectedSignature.endTime && (
                    <div>
                      <p className="text-sm text-gray-600">근무 시간</p>
                      <p className="font-medium text-gray-900">
                        {selectedSignature.startTime} -{' '}
                        {selectedSignature.endTime}
                      </p>
                    </div>
                  )}
                  {selectedSignature.classPeriodId && (
                    <div>
                      <p className="text-sm text-gray-600">교시</p>
                      <p className="font-medium text-gray-900">
                        {selectedSignature.classPeriodId}
                      </p>
                    </div>
                  )}
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
