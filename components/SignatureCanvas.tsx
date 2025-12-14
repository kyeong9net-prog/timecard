import React, { useRef, useState, useEffect } from 'react'

interface SignatureCanvasProps {
  onSave: (imageData: string) => void
  instructorName: string
  courseName: string
  date: string
  canSubmit?: boolean
}

export default function SignatureCanvas({
  onSave,
  instructorName,
  courseName,
  date,
  canSubmit = true,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 초기화
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setIsEmpty(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return

    const imageData = canvas.toDataURL('image/png')
    onSave(imageData)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 확인 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">서명 정보 확인</h2>
        <div className="space-y-2 text-gray-700">
          <div>
            <span className="font-semibold">강사명:</span> {instructorName}
          </div>
          <div>
            <span className="font-semibold">강의명:</span> {courseName}
          </div>
          <div>
            <span className="font-semibold">날짜:</span> {date}
          </div>
        </div>
      </div>

      {/* 서명 캔버스 */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">아래 영역에 서명해주세요</p>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="border border-gray-300 rounded bg-white cursor-crosshair w-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={clearCanvas}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-w-[100px]"
        >
          지우기
        </button>
        <button
          onClick={handleSave}
          disabled={isEmpty || !canSubmit}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[100px]"
        >
          제출
        </button>
      </div>
    </div>
  )
}
