/**
 * 강의 관리 페이지 (Phase 9)
 */

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import CourseFormModal from '@/components/admin/CourseFormModal'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { Course, AttendanceType, Instructor } from '@/types'
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deactivateCourse,
  searchCourses,
  isDuplicateCourseName,
  isDuplicateCourseCode,
} from '@/lib/course-utils'
import { getInstructorsByCourseId } from '@/lib/instructor-utils'
import { useAuth } from '@/contexts/AuthContext'

export default function CoursesPage() {
  const { admin } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [displayCourses, setDisplayCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deactivatingCourse, setDeactivatingCourse] = useState<Course | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    let filtered = courses

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) =>
        statusFilter === 'active' ? c.isActive : !c.isActive
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
      )
    }

    setDisplayCourses(filtered)
  }, [courses, searchQuery, statusFilter])

  const loadCourses = () => {
    const allCourses = getAllCourses()
    setCourses(allCourses)
  }

  const handleCreateClick = () => {
    setEditingCourse(null)
    setIsFormModalOpen(true)
  }

  const handleEditClick = (course: Course) => {
    setEditingCourse(course)
    setIsFormModalOpen(true)
  }

  const handleDeactivateClick = (course: Course) => {
    setDeactivatingCourse(course)
    setIsConfirmModalOpen(true)
  }

  const handleFormSubmit = (
    name: string,
    code: string,
    attendanceType: AttendanceType
  ) => {
    if (!admin) {
      setMessage({ type: 'error', text: '관리자 정보를 찾을 수 없습니다.' })
      return
    }

    setIsLoading(true)

    try {
      if (editingCourse) {
        // 수정 모드
        if (
          isDuplicateCourseName(name, editingCourse.id) ||
          isDuplicateCourseCode(code, editingCourse.id)
        ) {
          setMessage({
            type: 'error',
            text: '이미 존재하는 강의명 또는 강의 코드입니다.',
          })
          setIsLoading(false)
          return
        }

        updateCourse(editingCourse.id, name, code, attendanceType, admin.id, admin.name)
        setMessage({ type: 'success', text: '강의 정보가 수정되었습니다.' })
      } else {
        // 등록 모드
        if (isDuplicateCourseName(name) || isDuplicateCourseCode(code)) {
          setMessage({
            type: 'error',
            text: '이미 존재하는 강의명 또는 강의 코드입니다.',
          })
          setIsLoading(false)
          return
        }

        createCourse(name, code, attendanceType, admin.id, admin.name)
        setMessage({ type: 'success', text: '새 강의가 등록되었습니다.' })
      }

      setIsFormModalOpen(false)
      loadCourses()
    } catch (error) {
      setMessage({ type: 'error', text: '오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDeactivate = () => {
    if (!deactivatingCourse || !admin) return

    setIsLoading(true)

    try {
      deactivateCourse(deactivatingCourse.id, admin.id, admin.name)
      setMessage({ type: 'success', text: '강의가 비활성화되었습니다.' })
      setIsConfirmModalOpen(false)
      setDeactivatingCourse(null)
      loadCourses()
    } catch (error) {
      setMessage({ type: 'error', text: '오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  const getAttendanceTypeLabel = (type: AttendanceType): string => {
    switch (type) {
      case 'daily-multiple':
        return '유형1: 강의 시간 또는 실제 시간'
      case 'time-range':
        return '유형2: 시간 범위'
      case 'class-period':
        return '유형3: 교시 선택'
      default:
        return type
    }
  }

  return (
    <AdminLayout title="강의 관리">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">강의 관리</h1>
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            강의 등록
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="강의명 또는 강의 코드로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  강의명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  강의 코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  출석 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  배정 강사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchQuery || statusFilter !== 'all'
                      ? '검색 결과가 없습니다.'
                      : '등록된 강의가 없습니다.'}
                  </td>
                </tr>
              ) : (
                displayCourses.map((course) => {
                  const instructors = getInstructorsByCourseId(course.id)
                  return (
                    <tr
                      key={course.id}
                      className={!course.isActive ? 'bg-gray-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {course.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {course.code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getAttendanceTypeLabel(course.attendanceType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {instructors.length > 0
                            ? instructors.map((i: Instructor) => i.name).join(', ')
                            : '배정 없음'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            course.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {course.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(course)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          수정
                        </button>
                        {course.isActive && (
                          <button
                            onClick={() => handleDeactivateClick(course)}
                            className="text-red-600 hover:text-red-900"
                          >
                            비활성화
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CourseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        course={editingCourse}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDeactivate}
        title="강의 비활성화"
        message={`"${deactivatingCourse?.name}" 강의를 비활성화하시겠습니까? 기존 출석 서명은 유지됩니다.`}
        confirmText="비활성화"
        confirmButtonColor="red"
        isLoading={isLoading}
      />
    </AdminLayout>
  )
}
