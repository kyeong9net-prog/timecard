import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import ApproverSignatureCanvas from '@/components/ApproverSignatureCanvas'
import {
  getAllSignatures,
  getApproverSignatureByMonth,
  getMonthLock,
  isMonthLocked,
  saveApproverSignature,
  saveMonthLock,
  saveAdminLog,
  unlockMonth,
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
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false)
  const [showLockConfirm, setShowLockConfirm] = useState(false)
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false)
  const [unlockReason, setUnlockReason] = useState('')

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

  // 확인자 서명 저장
  const handleSaveApproverSignature = (imageData: string) => {
    if (!admin) return

    const newSignature = {
      id: `approver-sig-${Date.now()}`,
      approverId: admin.id,
      approverName: admin.name,
      month: selectedMonth,
      imageData,
      timestamp: new Date().toISOString(),
    }

    saveApproverSignature(newSignature)
    setShowSignatureCanvas(false)

    // 서명 후 마감 확인 모달 표시
    setShowLockConfirm(true)
  }

  // 월 마감 처리
  const handleLockMonth = () => {
    if (!admin || !approverSignature) return

    const lock = {
      id: `lock-${Date.now()}`,
      month: selectedMonth,
      lockedBy: admin.id,
      lockedByName: admin.name,
      lockedAt: new Date().toISOString(),
      approverSignatureId: approverSignature.id,
    }

    saveMonthLock(lock)

    // 로그 기록
    saveAdminLog({
      id: `log-${Date.now()}`,
      adminId: admin.id,
      adminName: admin.name,
      action: 'lock_month',
      targetType: 'month',
      targetId: selectedMonth,
      targetName: selectedMonth,
      timestamp: new Date().toISOString(),
      details: {
        signatureCount: monthSignatures.length,
      },
    })

    setShowLockConfirm(false)
    // 페이지 새로고침으로 마감 상태 반영
    window.location.reload()
  }

  // 월 마감 해제 처리 (슈퍼 관리자 전용)
  const handleUnlockMonth = () => {
    if (!admin || admin.role !== 'super-admin') return
    if (!unlockReason.trim()) {
      alert('마감 해제 사유를 입력해주세요.')
      return
    }

    unlockMonth(selectedMonth)

    // 로그 기록
    saveAdminLog({
      id: `log-${Date.now()}`,
      adminId: admin.id,
      adminName: admin.name,
      action: 'unlock_month',
      targetType: 'month',
      targetId: selectedMonth,
      targetName: selectedMonth,
      reason: unlockReason,
      timestamp: new Date().toISOString(),
    })

    setShowUnlockConfirm(false)
    setUnlockReason('')
    // 페이지 새로고침으로 마감 해제 상태 반영
    window.location.reload()
  }

  return (
    <AdminLayout title="월별 출근부 조회">
      <div className="max-w-7xl mx-auto">
        {/* 월 선택 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">조회 월 선택</h2>
            {isLocked && (
              <div className="flex items-center space-x-3">
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                  🔒 마감됨
                </span>
                {monthLock && (
                  <span className="text-sm text-gray-600">
                    {monthLock.lockedByName} (
                    {formatTimestamp(monthLock.lockedAt).split(' ')[0]})
                  </span>
                )}
                {admin?.role === 'super-admin' && (
                  <button
                    onClick={() => setShowUnlockConfirm(true)}
                    className="px-4 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    🔓 마감 해제
                  </button>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">확인자 서명</h2>
            {approverSignature && !isLocked && (
              <button
                onClick={() => setShowLockConfirm(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                🔒 월 마감
              </button>
            )}
          </div>

          {approverSignature ? (
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    확인자: {approverSignature.approverName}
                  </p>
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
          ) : showSignatureCanvas ? (
            <ApproverSignatureCanvas
              onSave={handleSaveApproverSignature}
              approverName={admin?.name || ''}
              month={selectedMonth}
              signatureCount={monthSignatures.length}
            />
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">아직 확인자 서명이 없습니다.</p>
              {!isLocked && (
                <button
                  onClick={() => setShowSignatureCanvas(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  서명하기
                </button>
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

      {/* 월 마감 확인 모달 */}
      {showLockConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowLockConfirm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              월 마감 확인
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                <span className="font-semibold">{selectedMonth}</span> 월을
                마감하시겠습니까?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ 마감 후에는 해당 월에 대한 다음 작업이 제한됩니다:
                </p>
                <ul className="text-sm text-yellow-800 mt-2 ml-4 list-disc space-y-1">
                  <li>강사의 서명 추가</li>
                  <li>관리자의 날짜 활성화</li>
                  <li>관리자의 서명 무효화</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                서명 건수: <span className="font-medium">{monthSignatures.length}건</span>
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLockConfirm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLockMonth}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                마감 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 월 마감 해제 확인 모달 (슈퍼 관리자 전용) */}
      {showUnlockConfirm && admin?.role === 'super-admin' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowUnlockConfirm(false)
            setUnlockReason('')
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              월 마감 해제 (슈퍼 관리자)
            </h3>
            <div className="space-y-4 mb-6">
              <p className="text-gray-700">
                <span className="font-semibold">{selectedMonth}</span> 월의 마감을
                해제하시겠습니까?
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-sm text-orange-800">
                  ⚠️ 마감 해제 후 다음 작업이 가능해집니다:
                </p>
                <ul className="text-sm text-orange-800 mt-2 ml-4 list-disc space-y-1">
                  <li>강사의 서명 추가</li>
                  <li>관리자의 날짜 활성화</li>
                  <li>관리자의 서명 무효화</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  마감 해제 사유 (필수)
                </label>
                <textarea
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="마감 해제 사유를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowUnlockConfirm(false)
                  setUnlockReason('')
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUnlockMonth}
                disabled={!unlockReason.trim()}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                마감 해제
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
