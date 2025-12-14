import React, { useRef, useState, useEffect } from 'react'

interface ApproverSignatureCanvasProps {
  onSave: (imageData: string) => void
  approverName: string
  month: string
  signatureCount: number
}

export default function ApproverSignatureCanvas({
  onSave,
  approverName,
  month,
  signatureCount,
}: ApproverSignatureCanvasProps) {
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

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x =
      'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y =
      'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setIsEmpty(false)
  }

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x =
      'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y =
      'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

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
    <div className="space-y-4">
      {/* 확인 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          월별 출근부 확인 서명
        </h3>
        <div className="space-y-1 text-sm text-gray-700">
          <div>
            <span className="font-semibold">확인자:</span> {approverName}
          </div>
          <div>
            <span className="font-semibold">대상 월:</span> {month}
          </div>
          <div>
            <span className="font-semibold">서명 건수:</span> {signatureCount}건
          </div>
        </div>
      </div>

      {/* 서명 캔버스 */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">아래 영역에 서명해주세요</p>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
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
      <div className="flex gap-3 justify-end">
        <button
          onClick={clearCanvas}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          지우기
        </button>
        <button
          onClick={handleSave}
          disabled={isEmpty}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          서명 저장
        </button>
      </div>
    </div>
  )
}
