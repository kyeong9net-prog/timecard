import React from 'react'

interface TimeTextInputProps {
  value: string
  onChange: (value: string) => void
}

export default function TimeTextInput({ value, onChange }: TimeTextInputProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        시간 정보 입력
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 2시간, 14:00-16:00, 오후"
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
      />
      <p className="text-sm text-gray-500 mt-2">
        자유롭게 입력하세요 (예: 2시간, 14:00-16:00, 오후 2시)
      </p>
    </div>
  )
}
