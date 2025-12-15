import React, { useRef, useState, useEffect } from 'react'
import { rafThrottle } from '@/lib/performance-utils'

interface SignatureCanvasProps {
  onSave: (imageData: string) => void
  instructorName: string
  courseName: string
  date: string
  canSubmit?: boolean
  onReturnHome?: () => void
}

export default function SignatureCanvas({
  onSave,
  instructorName,
  courseName,
  date,
  canSubmit = true,
  onReturnHome,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const isDrawingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Performance: Use willReadFrequently for better performance when reading pixels
    const ctx = canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: true
    })
    if (!ctx) return

    // 캔버스 초기화 - 부드러운 선 그리기 설정
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Performance: Disable image smoothing for faster rendering
    ctx.imageSmoothingEnabled = false
  }, [])

  // Sync ref with state
  useEffect(() => {
    isDrawingRef.current = isDrawing
  }, [isDrawing])

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

  // Optimized draw function with RAF throttling for smooth 60fps rendering
  const drawImmediate = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return

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

  // Create throttled version once using useMemo
  const draw = React.useMemo(() => rafThrottle(drawImmediate), [])

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
          style={{ touchAction: 'none' }}
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
      <div className="flex gap-4 justify-between">
        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="min-h-[44px] px-6 py-3 bg-gray-200 text-gray-700 text-base rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 touch-manipulation focus:ring-2 focus:ring-gray-400 focus:outline-none"
            aria-label="처음으로 돌아가기"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>처음으로</span>
          </button>
        )}
        <div className="flex gap-4 ml-auto">
          <button
            onClick={clearCanvas}
            className="min-h-[44px] min-w-[100px] px-6 py-3 bg-gray-200 text-gray-700 text-base rounded-lg hover:bg-gray-300 transition-colors touch-manipulation focus:ring-2 focus:ring-gray-400 focus:outline-none"
            aria-label="서명 지우기"
          >
            지우기
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty || !canSubmit}
            className="min-h-[44px] min-w-[100px] px-6 py-3 bg-blue-600 text-white text-base rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-manipulation focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="서명 제출하기"
          >
            제출
          </button>
        </div>
      </div>
    </div>
  )
}
