import React from 'react'
import { Instructor } from '@/types'

interface InstructorSelectorProps {
  instructors: Instructor[]
  onSelect: (instructor: Instructor) => void
}

export default function InstructorSelector({
  instructors,
  onSelect,
}: InstructorSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {instructors.map((instructor) => (
        <button
          key={instructor.id}
          onClick={() => onSelect(instructor)}
          className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-center"
        >
          <div className="text-xl font-semibold text-gray-800">
            {instructor.name}
          </div>
        </button>
      ))}
    </div>
  )
}
