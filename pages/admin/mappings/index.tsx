/**
 * 강사-강의 배정 관리 페이지 (Phase 9)
 */

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { Instructor, Course } from '@/types'
import {
  getAllInstructors,
  getInstructorCourseIds,
  addCourseToInstructor,
  removeCourseFromInstructor,
} from '@/lib/instructor-utils'
import { getAllCourses, getCourseById } from '@/lib/course-utils'
import { useAuth } from '@/contexts/AuthContext'

export default function MappingsPage() {
  const { admin } = useAuth()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('')
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'add' | 'remove'
    courseId: string
    courseName: string
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedInstructorId) {
      const courseIds = getInstructorCourseIds(selectedInstructorId)
      setAssignedCourseIds(courseIds)

      const available = courses.filter(
        (c) => c.isActive && !courseIds.includes(c.id)
      )
      setAvailableCourses(available)
    } else {
      setAssignedCourseIds([])
      setAvailableCourses([])
    }
  }, [selectedInstructorId, courses])

  const loadData = () => {
    const allInstructors = getAllInstructors()
    const allCourses = getAllCourses()
    setInstructors(allInstructors)
    setCourses(allCourses)
  }

  const handleAddCourseClick = (courseId: string) => {
    const course = getCourseById(courseId)
    if (!course) return

    setConfirmAction({
      type: 'add',
      courseId,
      courseName: course.name,
    })
    setIsConfirmModalOpen(true)
  }

  const handleRemoveCourseClick = (courseId: string) => {
    const course = getCourseById(courseId)
    if (!course) return

    setConfirmAction({
      type: 'remove',
      courseId,
      courseName: course.name,
    })
    setIsConfirmModalOpen(true)
  }

  const handleConfirm = () => {
    if (!confirmAction || !admin || !selectedInstructorId) return

    setIsLoading(true)

    try {
      if (confirmAction.type === 'add') {
        addCourseToInstructor(
          selectedInstructorId,
          confirmAction.courseId,
          admin.id,
          admin.name
        )
        setMessage({
          type: 'success',
          text: `"${confirmAction.courseName}" 강의가 배정되었습니다.`,
        })
      } else {
        removeCourseFromInstructor(
          selectedInstructorId,
          confirmAction.courseId,
          admin.id,
          admin.name
        )
        setMessage({
          type: 'success',
          text: `"${confirmAction.courseName}" 강의 배정이 해제되었습니다.`,
        })
      }

      setIsConfirmModalOpen(false)
      setConfirmAction(null)
      loadData()

      // 선택된 강사의 배정 정보 재로드
      const courseIds = getInstructorCourseIds(selectedInstructorId)
      setAssignedCourseIds(courseIds)
      const available = courses.filter(
        (c) => c.isActive && !courseIds.includes(c.id)
      )
      setAvailableCourses(available)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '오류가 발생했습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedInstructor = instructors.find(
    (i) => i.id === selectedInstructorId
  )

  const assignedCourses = assignedCourseIds
    .map((id) => getCourseById(id))
    .filter((c): c is Course => c !== null)

  return (
    <AdminLayout title="강사-강의 배정">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">강사-강의 배정</h1>
          <p className="mt-2 text-gray-600">
            강사에게 강의를 배정하거나 배정을 해제합니다.
          </p>
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

        {/* 강사 선택 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            강사 선택
          </label>
          <select
            value={selectedInstructorId}
            onChange={(e) => setSelectedInstructorId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">강사를 선택하세요</option>
            {instructors
              .filter((i) => i.isActive)
              .map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
          </select>
        </div>

        {selectedInstructor && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 배정된 강의 목록 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  배정된 강의 ({assignedCourses.length})
                </h2>
              </div>
              <div className="p-6">
                {assignedCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    배정된 강의가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assignedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {course.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.code}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCourseClick(course.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          해제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 배정 가능한 강의 목록 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  배정 가능한 강의 ({availableCourses.length})
                </h2>
              </div>
              <div className="p-6">
                {availableCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    배정 가능한 강의가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {availableCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {course.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.code}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddCourseClick(course.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          배정
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedInstructor && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="mt-4 text-gray-600">
              강사를 선택하여 강의 배정을 관리하세요.
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        title={
          confirmAction?.type === 'add' ? '강의 배정' : '강의 배정 해제'
        }
        message={
          confirmAction?.type === 'add'
            ? `"${confirmAction?.courseName}" 강의를 배정하시겠습니까?`
            : `"${confirmAction?.courseName}" 강의 배정을 해제하시겠습니까?`
        }
        confirmText={confirmAction?.type === 'add' ? '배정' : '해제'}
        confirmButtonColor={confirmAction?.type === 'add' ? 'blue' : 'red'}
        isLoading={isLoading}
      />
    </AdminLayout>
  )
}
