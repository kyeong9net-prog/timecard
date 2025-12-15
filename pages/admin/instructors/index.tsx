/**
 * 강사 관리 페이지 (Phase 9)
 * 강사 목록 조회, 등록, 수정, 비활성화 기능
 */

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import InstructorFormModal from '@/components/admin/InstructorFormModal'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { Instructor } from '@/types'
import {
  getAllInstructors,
  createInstructor,
  updateInstructor,
  deactivateInstructor,
  searchInstructors,
  filterInstructorsByStatus,
  getInstructorCourseIds,
} from '@/lib/instructor-utils'
import { getAllCourses } from '@/lib/course-utils'
import { useAuth } from '@/contexts/AuthContext'

export default function InstructorsPage() {
  const { admin } = useAuth()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [displayInstructors, setDisplayInstructors] = useState<Instructor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // 모달 상태
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // 데이터 로드
  useEffect(() => {
    loadInstructors()
  }, [])

  // 검색 및 필터링
  useEffect(() => {
    let filtered = instructors

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filterInstructorsByStatus(statusFilter)
    }

    // 검색
    if (searchQuery.trim()) {
      filtered = searchInstructors(searchQuery)
      if (statusFilter !== 'all') {
        filtered = filtered.filter((i) =>
          statusFilter === 'active' ? i.isActive : !i.isActive
        )
      }
    }

    setDisplayInstructors(filtered)
  }, [instructors, searchQuery, statusFilter])

  const loadInstructors = () => {
    const data = getAllInstructors()
    setInstructors(data)
  }

  const handleCreateClick = () => {
    setSelectedInstructor(null)
    setIsFormModalOpen(true)
  }

  const handleEditClick = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setIsFormModalOpen(true)
  }

  const handleDeactivateClick = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setIsConfirmModalOpen(true)
  }

  const handleFormSubmit = async (name: string) => {
    if (!admin) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      if (selectedInstructor) {
        // 수정
        updateInstructor(selectedInstructor.id, name, admin.id, admin.name)
        setSuccessMessage('강사 정보가 수정되었습니다.')
      } else {
        // 생성
        createInstructor(name, admin.id, admin.name)
        setSuccessMessage('새 강사가 등록되었습니다.')
      }

      loadInstructors()
      setIsFormModalOpen(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('오류가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateConfirm = async () => {
    if (!admin || !selectedInstructor) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      deactivateInstructor(selectedInstructor.id, admin.id, admin.name)
      setSuccessMessage('강사가 비활성화되었습니다.')
      loadInstructors()
      setIsConfirmModalOpen(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('오류가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 강사별 담당 강의 개수 계산
  const getCourseCount = (instructorId: string): number => {
    return getInstructorCourseIds(instructorId).length
  }

  // 강사별 담당 강의명 가져오기
  const getCourseNames = (instructorId: string): string => {
    const courseIds = getInstructorCourseIds(instructorId)
    const allCourses = getAllCourses()
    const courseNames = courseIds
      .map((id) => allCourses.find((c) => c.id === id)?.name)
      .filter(Boolean)
    return courseNames.length > 0 ? courseNames.join(', ') : '없음'
  }

  return (
    <AdminLayout title="강사 관리">
      <div className="max-w-7xl mx-auto">
        {/* 성공/에러 메시지 */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* 상단 액션 바 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="강사명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            + 강사 등록
          </button>
        </div>

        {/* 강사 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  강사명
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  담당 강의
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  강의 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayInstructors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? '검색 결과가 없습니다.'
                      : '등록된 강사가 없습니다.'}
                  </td>
                </tr>
              ) : (
                displayInstructors.map((instructor) => (
                  <tr
                    key={instructor.id}
                    className={`hover:bg-gray-50 ${!instructor.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {instructor.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-md truncate">
                        {getCourseNames(instructor.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {getCourseCount(instructor.id)}개
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {instructor.isActive ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          활성
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          비활성
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditClick(instructor)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        수정
                      </button>
                      {instructor.isActive && (
                        <button
                          onClick={() => handleDeactivateClick(instructor)}
                          className="text-red-600 hover:text-red-900"
                        >
                          비활성화
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 총 개수 표시 */}
        <div className="mt-4 text-sm text-gray-600">
          총 {displayInstructors.length}명의 강사
        </div>
      </div>

      {/* 강사 등록/수정 모달 */}
      <InstructorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        instructor={selectedInstructor}
        isLoading={isLoading}
      />

      {/* 비활성화 확인 모달 */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeactivateConfirm}
        title="강사 비활성화"
        message={`"${selectedInstructor?.name}" 강사를 비활성화하시겠습니까?\n\n기존 서명 기록은 유지됩니다.`}
        confirmText="비활성화"
        confirmButtonColor="red"
        isLoading={isLoading}
      />
    </AdminLayout>
  )
}
