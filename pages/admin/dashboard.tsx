import React, { useState, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'
import StorageUsageWidget from '@/components/admin/StorageUsageWidget'
import {
  getAllSignatures,
  saveActivatedDate,
  saveAdminLog,
  invalidateSignature,
  isMonthLocked,
  getMonthFromDate,
} from '@/lib/storage-utils'
import { mockInstructors, mockCourses } from '@/data'
import { Signature, ActivatedDate, AdminLog } from '@/types'
import { formatTimestamp, getCurrentTimestampKST } from '@/lib/time-utils'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminDashboardPage() {
  const { admin } = useAuth()
  const [signatures, setSignatures] = useState<Signature[]>(() =>
    getAllSignatures()
  )
  const [filterInstructor, setFilterInstructor] = useState<string>('')
  const [filterCourse, setFilterCourse] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(
    null
  )

  // 날짜 활성화 모달 상태
  const [showActivateModal, setShowActivateModal] = useState<boolean>(false)
  const [activateForm, setActivateForm] = useState({
    instructorId: '',
    courseId: '',
    date: '',
    reason: '',
  })
  const [activateError, setActivateError] = useState<string>('')

  // 서명 무효화 모달 상태
  const [showInvalidateModal, setShowInvalidateModal] = useState<boolean>(false)
  const [invalidateReason, setInvalidateReason] = useState<string>('')
  const [invalidateError, setInvalidateError] = useState<string>('')
  const [signatureToInvalidate, setSignatureToInvalidate] =
    useState<Signature | null>(null)

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

  const handleOpenActivateModal = () => {
    setShowActivateModal(true)
    setActivateForm({ instructorId: '', courseId: '', date: '', reason: '' })
    setActivateError('')
  }

  const handleCloseActivateModal = () => {
    setShowActivateModal(false)
    setActivateForm({ instructorId: '', courseId: '', date: '', reason: '' })
    setActivateError('')
  }

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActivateError('')

    // 유효성 검사
    if (
      !activateForm.instructorId ||
      !activateForm.courseId ||
      !activateForm.date ||
      !activateForm.reason.trim()
    ) {
      setActivateError('모든 필드를 입력해주세요.')
      return
    }

    if (!admin) {
      setActivateError('관리자 정보를 찾을 수 없습니다.')
      return
    }

    try {
      const instructor = mockInstructors.find(
        (i) => i.id === activateForm.instructorId
      )
      const course = mockCourses.find((c) => c.id === activateForm.courseId)

      if (!instructor || !course) {
        setActivateError('강사 또는 강의 정보를 찾을 수 없습니다.')
        return
      }

      // 월 마감 확인
      const targetMonth = getMonthFromDate(activateForm.date)
      if (isMonthLocked(targetMonth)) {
        setActivateError(
          `${targetMonth} 월은 이미 마감되었습니다. 날짜를 활성화할 수 없습니다.`
        )
        return
      }

      // 활성화 날짜 저장
      const activatedDate: ActivatedDate = {
        id: `activated-${Date.now()}`,
        instructorId: activateForm.instructorId,
        instructorName: instructor.name,
        courseId: activateForm.courseId,
        courseName: course.name,
        date: activateForm.date,
        reason: activateForm.reason,
        activatedBy: admin.id,
        activatedByName: admin.name,
        activatedAt: getCurrentTimestampKST(),
      }
      saveActivatedDate(activatedDate)

      // 관리자 행위 로그 저장
      const log: AdminLog = {
        id: `log-${Date.now()}`,
        adminId: admin.id,
        adminName: admin.name,
        action: 'activate_date',
        targetType: 'date',
        targetId: activatedDate.id,
        targetName: `${instructor.name} - ${course.name} (${activateForm.date})`,
        reason: activateForm.reason,
        timestamp: getCurrentTimestampKST(),
        details: {
          instructorId: instructor.id,
          instructorName: instructor.name,
          courseId: course.id,
          courseName: course.name,
          date: activateForm.date,
        },
      }
      saveAdminLog(log)

      // 성공 처리
      handleCloseActivateModal()
      alert('날짜가 성공적으로 활성화되었습니다.')
    } catch (error) {
      console.error('날짜 활성화 실패:', error)
      setActivateError('날짜 활성화 중 오류가 발생했습니다.')
    }
  }

  const handleOpenInvalidateModal = (signature: Signature) => {
    setSignatureToInvalidate(signature)
    setShowInvalidateModal(true)
    setInvalidateReason('')
    setInvalidateError('')
  }

  const handleCloseInvalidateModal = () => {
    setShowInvalidateModal(false)
    setSignatureToInvalidate(null)
    setInvalidateReason('')
    setInvalidateError('')
  }

  const handleInvalidateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInvalidateError('')

    // 유효성 검사
    if (!invalidateReason.trim()) {
      setInvalidateError('무효화 사유를 입력해주세요.')
      return
    }

    if (!admin) {
      setInvalidateError('관리자 정보를 찾을 수 없습니다.')
      return
    }

    if (!signatureToInvalidate) {
      setInvalidateError('서명 정보를 찾을 수 없습니다.')
      return
    }

    try {
      // 월 마감 확인
      const targetMonth = getMonthFromDate(signatureToInvalidate.date)
      if (isMonthLocked(targetMonth)) {
        setInvalidateError(
          `${targetMonth} 월은 이미 마감되었습니다. 서명을 무효화할 수 없습니다.`
        )
        return
      }

      // 서명 무효화
      invalidateSignature(signatureToInvalidate.id)

      // 관리자 행위 로그 저장
      const log: AdminLog = {
        id: `log-${Date.now()}`,
        adminId: admin.id,
        adminName: admin.name,
        action: 'invalidate_signature',
        targetType: 'signature',
        targetId: signatureToInvalidate.id,
        targetName: `${signatureToInvalidate.instructorName} - ${signatureToInvalidate.courseName} (${signatureToInvalidate.date})`,
        reason: invalidateReason,
        timestamp: getCurrentTimestampKST(),
        details: {
          instructorId: signatureToInvalidate.instructorId,
          instructorName: signatureToInvalidate.instructorName,
          courseId: signatureToInvalidate.courseId,
          courseName: signatureToInvalidate.courseName,
          date: signatureToInvalidate.date,
        },
      }
      saveAdminLog(log)

      // 성공 처리
      handleCloseInvalidateModal()
      setSelectedSignature(null)
      setSignatures(getAllSignatures()) // 서명 목록 새로고침
      alert('서명이 무효화되었습니다.')
    } catch (error) {
      console.error('서명 무효화 실패:', error)
      setInvalidateError('서명 무효화 중 오류가 발생했습니다.')
    }
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

        {/* 저장소 사용량 위젯 */}
        <div className="mb-8">
          <StorageUsageWidget />
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">필터</h2>
            <div className="space-x-2">
              <button
                onClick={handleOpenActivateModal}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                날짜 활성화
              </button>
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

              <div className="mt-6 flex justify-end space-x-2">
                {selectedSignature.status !== 'invalidated' && (
                  <button
                    onClick={() => handleOpenInvalidateModal(selectedSignature)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    무효화
                  </button>
                )}
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

      {/* 날짜 활성화 모달 */}
      {showActivateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseActivateModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  날짜 활성화
                </h3>
                <button
                  onClick={handleCloseActivateModal}
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

              <form onSubmit={handleActivateSubmit} className="space-y-4">
                {activateError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{activateError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    강사 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={activateForm.instructorId}
                    onChange={(e) =>
                      setActivateForm({
                        ...activateForm,
                        instructorId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">강사를 선택하세요</option>
                    {mockInstructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    강의 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={activateForm.courseId}
                    onChange={(e) =>
                      setActivateForm({
                        ...activateForm,
                        courseId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">강의를 선택하세요</option>
                    {mockCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={activateForm.date}
                    onChange={(e) =>
                      setActivateForm({ ...activateForm, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    활성화 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={activateForm.reason}
                    onChange={(e) =>
                      setActivateForm({
                        ...activateForm,
                        reason: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="활성화 사유를 입력하세요"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseActivateModal}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    활성화
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 서명 무효화 모달 */}
      {showInvalidateModal && signatureToInvalidate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseInvalidateModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  서명 무효화
                </h3>
                <button
                  onClick={handleCloseInvalidateModal}
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

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">서명 정보</p>
                <p className="font-medium text-gray-900">
                  {signatureToInvalidate.instructorName} -{' '}
                  {signatureToInvalidate.courseName}
                </p>
                <p className="text-sm text-gray-600">
                  {signatureToInvalidate.date} /{' '}
                  {formatTimestamp(signatureToInvalidate.timestamp)}
                </p>
              </div>

              <form onSubmit={handleInvalidateSubmit} className="space-y-4">
                {invalidateError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{invalidateError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    무효화 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={invalidateReason}
                    onChange={(e) => setInvalidateReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="무효화 사유를 입력하세요"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseInvalidateModal}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    무효화
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
