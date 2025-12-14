import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import SignatureCanvas from '@/components/SignatureCanvas'
import { getInstructorById, getCourseById } from '@/lib/instructors'

export default function SignaturePage() {
  const router = useRouter()
  const { courseId, instructorId } = router.query
  const [instructorName, setInstructorName] = useState<string>('')
  const [courseName, setCourseName] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    if (typeof instructorId === 'string' && typeof courseId === 'string') {
      const instructor = getInstructorById(instructorId)
      const course = getCourseById(courseId)

      if (instructor) setInstructorName(instructor.name)
      if (course) setCourseName(course.name)

      // 현재 날짜 설정 (KST)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      setCurrentDate(`${year}-${month}-${day}`)
    }
  }, [instructorId, courseId])

  const handleSave = (imageData: string) => {
    // Phase 2에서 구현될 저장 로직
    console.log('서명 저장:', {
      instructorId,
      courseId,
      imageData,
      date: currentDate,
    })

    // 임시: 저장 완료 메시지
    alert('서명이 저장되었습니다! (Phase 2에서 실제 저장 기능이 구현됩니다)')

    // 강의 선택 화면으로 돌아가기
    router.push(`/sign?instructorId=${instructorId}`)
  }

  if (!instructorId || !courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">정보를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="서명 입력" />

      <main className="container mx-auto py-8">
        <SignatureCanvas
          onSave={handleSave}
          instructorName={instructorName}
          courseName={courseName}
          date={currentDate}
        />
      </main>
    </div>
  )
}
