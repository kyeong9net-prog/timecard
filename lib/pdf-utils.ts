/**
 * PDF 생성 유틸리티 함수
 * jsPDF와 jspdf-autotable을 사용하여 출근부 PDF를 생성합니다.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Signature, ApproverSignature } from '@/types'
import { formatTimestamp } from '@/lib/time-utils'

// jsPDF에 autoTable 타입 확장
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

/**
 * PDF 파일명 생성
 */
export function generatePdfFileName(
  type: 'instructor' | 'course',
  name: string,
  month: string
): string {
  const typeLabel = type === 'instructor' ? '강사' : '강의'
  return `출근부_${typeLabel}_${name}_${month}.pdf`
}

/**
 * 출근부 PDF 생성
 */
export function generateAttendancePdf(
  signatures: Signature[],
  targetName: string,
  month: string,
  exportType: 'instructor' | 'course',
  approverSignature: ApproverSignature | null,
  exportedByName: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // 한글 폰트 설정 (기본 폰트 사용, 한글 지원 제한적)
  doc.setFont('helvetica')

  // 제목
  doc.setFontSize(18)
  doc.text('출근부', 105, 20, { align: 'center' })

  // 부제목
  doc.setFontSize(12)
  const subtitle =
    exportType === 'instructor'
      ? `강사: ${targetName}`
      : `강의: ${targetName}`
  doc.text(subtitle, 105, 30, { align: 'center' })
  doc.text(`대상 월: ${month}`, 105, 37, { align: 'center' })

  // 서명 목록 테이블
  const tableData = signatures.map((sig) => {
    let statusText = ''
    if (sig.status === 'normal') statusText = '정상'
    else if (sig.status === 'activated') statusText = '활성화'
    else if (sig.status === 'invalidated') statusText = '무효화'

    return [
      sig.date,
      exportType === 'instructor' ? sig.courseName : sig.instructorName,
      formatTimestamp(sig.timestamp).split(' ')[1], // 시간만
      statusText,
    ]
  })

  const headers =
    exportType === 'instructor'
      ? [['날짜', '강의', '서명 시각', '상태']]
      : [['날짜', '강사', '서명 시각', '상태']]

  autoTable(doc, {
    startY: 45,
    head: headers,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      textColor: 50,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 35 },
      1: { halign: 'left', cellWidth: 70 },
      2: { halign: 'center', cellWidth: 40 },
      3: { halign: 'center', cellWidth: 30 },
    },
    didParseCell: (data) => {
      // 무효화된 서명 표시
      if (data.section === 'body') {
        const rowIndex = data.row.index
        if (signatures[rowIndex]?.status === 'invalidated') {
          data.cell.styles.textColor = [150, 150, 150]
          data.cell.styles.fontStyle = 'italic'
        }
      }
    },
  })

  // 현재 Y 위치 계산
  const finalY = (doc as any).lastAutoTable.finalY || 45

  // 확인자 서명 섹션
  if (approverSignature) {
    doc.setFontSize(12)
    doc.text('확인자 서명', 20, finalY + 15)

    doc.setFontSize(10)
    doc.text(
      `확인자: ${approverSignature.approverName}`,
      20,
      finalY + 22
    )
    doc.text(
      `서명 시각: ${formatTimestamp(approverSignature.timestamp)}`,
      20,
      finalY + 28
    )

    // 서명 이미지 추가 (base64)
    try {
      doc.addImage(
        approverSignature.imageData,
        'PNG',
        20,
        finalY + 32,
        60,
        20
      )
    } catch (error) {
      console.error('확인자 서명 이미지 추가 실패:', error)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('(서명 이미지 로드 실패)', 20, finalY + 42)
      doc.setTextColor(0, 0, 0)
    }
  }

  // 출력 정보 (페이지 하단)
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  doc.text(`출력 일시: ${now}`, 20, 280)
  doc.text(`출력자: ${exportedByName}`, 20, 285)
  doc.setTextColor(0, 0, 0)

  return doc
}

/**
 * PDF Blob 생성 (미리보기용)
 */
export function generatePdfBlob(doc: jsPDF): Blob {
  return doc.output('blob')
}

/**
 * PDF 다운로드
 */
export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
