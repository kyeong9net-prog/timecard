/**
 * 강의 등록/수정 모달 컴포넌트 (Phase 9)
 */

import React, { useState, useEffect } from 'react'
import { Course, AttendanceType } from '@/types'

interface CourseFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, code: string, attendanceType: AttendanceType) => void
  course?: Course | null // 수정 모드인 경우 전달
  isLoading?: boolean
}

export default function CourseFormModal({
  isOpen,
  onClose,
  onSubmit,
  course,
  isLoading = false,
}: CourseFormModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('daily-multiple')
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({})

  const isEditMode = !!course

  // 수정 모드일 때 초기값 설정
  useEffect(() => {
    if (course) {
      setName(course.name)
      setCode(course.code)
      setAttendanceType(course.attendanceType)
    } else {
      setName('')
      setCode('')
      setAttendanceType('daily-multiple')
    }
    setErrors({})
  }, [course, isOpen])

  const validate = (): boolean => {
    const newErrors: { name?: string; code?: string } = {}

    const trimmedName = name.trim()
    const trimmedCode = code.trim()

    if (!trimmedName) {
      newErrors.name = '강의명을 입력해주세요.'
    } else if (trimmedName.length < 2) {
      newErrors.name = '강의명은 2자 이상 입력해주세요.'
    } else if (trimmedName.length > 100) {
      newErrors.name = '강의명은 100자 이하로 입력해주세요.'
    }

    if (!trimmedCode) {
      newErrors.code = '강의 코드를 입력해주세요.'
    } else if (trimmedCode.length < 2) {
      newErrors.code = '강의 코드는 2자 이상 입력해주세요.'
    } else if (trimmedCode.length > 50) {
      newErrors.code = '강의 코드는 50자 이하로 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit(name.trim(), code.trim(), attendanceType)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {isEditMode ? '강의 정보 수정' : '새 강의 등록'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                강의명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 파이썬 프로그래밍"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                강의 코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: PY101"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                출석 유형 <span className="text-red-500">*</span>
              </label>
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value as AttendanceType)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="daily-multiple">유형1: 강의 시간 또는 실제 시간</option>
                <option value="time-range">유형2: 시간 범위</option>
                <option value="class-period">유형3: 교시 선택</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {attendanceType === 'daily-multiple' &&
                  '강사가 "3시간" 또는 "14:00-16:00" 형식으로 입력'}
                {attendanceType === 'time-range' && '강사가 시작/종료 시간을 선택'}
                {attendanceType === 'class-period' && '강사가 교시를 선택'}
              </p>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {isLoading ? '처리 중...' : isEditMode ? '수정' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
