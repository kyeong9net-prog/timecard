import React, { useState, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import { mockInstructors, mockCourses } from '@/data'
import {
  getAllSignatures,
  getApproverSignatureByMonth,
  savePdfExportHistory,
  saveAdminLog,
} from '@/lib/storage-utils'
import {
  generateAttendancePdf,
  generatePdfFileName,
  generatePdfBlob,
  downloadPdf,
} from '@/lib/pdf-utils'
import { formatTimestamp, getCurrentDateKST } from '@/lib/time-utils'
import { Signature, PdfExportType } from '@/types'

export default function ExportPage() {
  const { admin } = useAuth()
  const currentMonth = getCurrentDateKST().substring(0, 7)

  // 상태
  const [exportType, setExportType] = useState<PdfExportType>('instructor')
  const [targetId, setTargetId] = useState<string>('')
  const [month, setMonth] = useState<string>(currentMonth)
  const [showPreview, setShowPreview] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)

  // 선택된 대상 이름
  const targetName = useMemo(() => {
    if (!targetId) return ''
    if (exportType === 'instructor') {
      return mockInstructors.find((i) => i.id === targetId)?.name || ''
    } else {
      return mockCourses.find((c) => c.id === targetId)?.name || ''
    }
  }, [exportType, targetId])

  // 필터링된 서명 데이터
  const signatures = useMemo(() => {
    if (!targetId || !month) return []

    const allSignatures = getAllSignatures()
    return allSignatures.filter((sig) => {
      const matchesMonth = sig.date.startsWith(month)
      if (exportType === 'instructor') {
        return matchesMonth && sig.instructorId === targetId
      } else {
        return matchesMonth && sig.courseId === targetId
      }
    })
  }, [exportType, targetId, month])

  // 확인자 서명
  const approverSignature = useMemo(() => {
    return getApproverSignatureByMonth(month)
  }, [month])

  // 미리보기 생성
  const handlePreview = () => {
    if (!admin || !targetId || !targetName || signatures.length === 0) {
      alert('출력할 데이터가 없습니다.')
      return
    }

    const doc = generateAttendancePdf(
      signatures,
      targetName,
      month,
      exportType,
      approverSignature,
      admin.name
    )

    const blob = generatePdfBlob(doc)
    setPdfBlob(blob)
    setShowPreview(true)
  }

  // PDF 다운로드
  const handleDownload = () => {
    if (!admin || !targetId || !targetName || signatures.length === 0) {
      alert('출력할 데이터가 없습니다.')
      return
    }

    const doc = generateAttendancePdf(
      signatures,
      targetName,
      month,
      exportType,
      approverSignature,
      admin.name
    )

    const filename = generatePdfFileName(exportType, targetName, month)
    downloadPdf(doc, filename)

    // 출력 이력 저장
    savePdfExportHistory({
      id: `export-${Date.now()}`,
      exportType,
      targetId,
      targetName,
      month,
      exportedBy: admin.id,
      exportedByName: admin.name,
      exportedAt: new Date().toISOString(),
      signatureCount: signatures.length,
    })

    // 관리자 로그 저장
    saveAdminLog({
      id: `log-${Date.now()}`,
      adminId: admin.id,
      adminName: admin.name,
      action: 'export_pdf',
      targetType: exportType,
      targetId,
      targetName,
      timestamp: new Date().toISOString(),
      details: {
        month,
        signatureCount: signatures.length,
      },
    })

    alert('PDF가 다운로드되었습니다.')
  }

  return (
    <AdminLayout title="PDF 출력">
      <div className="max-w-4xl mx-auto">
        {/* 출력 옵션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            출력 옵션
          </h2>

          {/* 출력 유형 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              출력 유형
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="instructor"
                  checked={exportType === 'instructor'}
                  onChange={(e) => {
                    setExportType(e.target.value as PdfExportType)
                    setTargetId('')
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">강사별 출근부</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="course"
                  checked={exportType === 'course'}
                  onChange={(e) => {
                    setExportType(e.target.value as PdfExportType)
                    setTargetId('')
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">강의별 출근부</span>
              </label>
            </div>
          </div>

          {/* 대상 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {exportType === 'instructor' ? '강사 선택' : '강의 선택'}
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {exportType === 'instructor'
                  ? '강사를 선택하세요'
                  : '강의를 선택하세요'}
              </option>
              {exportType === 'instructor'
                ? mockInstructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))
                : mockCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* 월 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대상 월
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 데이터 미리보기 */}
        {targetId && month && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              데이터 미리보기
            </h2>

            {signatures.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                해당 조건에 맞는 서명 기록이 없습니다.
              </p>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {exportType === 'instructor' ? '강사' : '강의'}:{' '}
                      <span className="font-medium text-gray-900">
                        {targetName}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      대상 월:{' '}
                      <span className="font-medium text-gray-900">{month}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      서명 건수:{' '}
                      <span className="font-medium text-gray-900">
                        {signatures.length}건
                      </span>
                    </p>
                  </div>
                  {approverSignature && (
                    <div className="text-right">
                      <p className="text-xs text-green-600">
                        ✓ 확인자 서명 있음
                      </p>
                      <p className="text-xs text-gray-500">
                        {approverSignature.approverName}
                      </p>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          날짜
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {exportType === 'instructor' ? '강의' : '강사'}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          서명 시각
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {signatures.map((sig) => (
                        <tr key={sig.id}>
                          <td className="px-4 py-2 text-gray-900">
                            {sig.date}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {exportType === 'instructor'
                              ? sig.courseName
                              : sig.instructorName}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {formatTimestamp(sig.timestamp).split(' ')[1]}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                sig.status === 'normal'
                                  ? 'bg-green-100 text-green-800'
                                  : sig.status === 'activated'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {sig.status === 'normal'
                                ? '정상'
                                : sig.status === 'activated'
                                ? '활성화'
                                : '무효화'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handlePreview}
            disabled={!targetId || !month || signatures.length === 0}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            미리보기
          </button>
          <button
            onClick={handleDownload}
            disabled={!targetId || !month || signatures.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            PDF 다운로드
          </button>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && pdfBlob && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                PDF 미리보기
              </h3>
              <button
                onClick={() => setShowPreview(false)}
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
            <div className="flex-1 p-4 overflow-auto">
              <iframe
                src={URL.createObjectURL(pdfBlob)}
                className="w-full h-full border border-gray-300 rounded"
                title="PDF Preview"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  handleDownload()
                  setShowPreview(false)
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
