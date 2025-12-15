import React from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import InstructorSelector from '@/components/InstructorSelector'
import { getActiveInstructors } from '@/lib/instructors'
import { Instructor } from '@/types'

export default function Home() {
  const router = useRouter()
  const instructors = getActiveInstructors()

  const handleInstructorSelect = (instructor: Instructor) => {
    router.push(`/sign?instructorId=${instructor.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="서울특별시교육청 000초등학교 외부강사 전자 서명 출근부" />

      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            강사 선택
          </h2>
          <p className="text-gray-600">
            서명하실 강사님을 선택해주세요
          </p>
        </div>

        <InstructorSelector
          instructors={instructors}
          onSelect={handleInstructorSelect}
        />
      </main>
    </div>
  )
}
