/**
 * LocalStorage 관련 유틸리티 함수
 * 서명 데이터를 브라우저 LocalStorage에 저장하고 조회합니다.
 */

import { Signature } from '@/types'

const SIGNATURES_KEY = 'signatures'

/**
 * 서명 데이터를 LocalStorage에 저장
 */
export function saveSignature(signature: Signature): void {
  try {
    const signatures = getAllSignatures()
    signatures.push(signature)
    localStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures))
  } catch (error) {
    console.error('서명 저장 실패:', error)
    throw new Error('서명을 저장하는 중 오류가 발생했습니다.')
  }
}

/**
 * LocalStorage에서 모든 서명 데이터 조회
 */
export function getAllSignatures(): Signature[] {
  try {
    const data = localStorage.getItem(SIGNATURES_KEY)
    if (!data) return []
    return JSON.parse(data) as Signature[]
  } catch (error) {
    console.error('서명 조회 실패:', error)
    return []
  }
}

/**
 * 특정 강사의 서명 목록 조회
 */
export function getSignaturesByInstructor(instructorId: string): Signature[] {
  const signatures = getAllSignatures()
  return signatures.filter((sig) => sig.instructorId === instructorId)
}

/**
 * 특정 강의의 서명 목록 조회
 */
export function getSignaturesByCourse(courseId: string): Signature[] {
  const signatures = getAllSignatures()
  return signatures.filter((sig) => sig.courseId === courseId)
}

/**
 * 특정 날짜의 서명 목록 조회
 */
export function getSignaturesByDate(date: string): Signature[] {
  const signatures = getAllSignatures()
  return signatures.filter((sig) => sig.date === date)
}

/**
 * 중복 서명 체크
 * 같은 강사, 같은 강의, 같은 날짜에 이미 서명이 있는지 확인
 *
 * 출근부 유형에 따라 중복 체크 방식이 다름:
 * - daily-multiple: 같은 시간 텍스트가 있으면 중복
 * - time-range: 시간 범위가 겹치면 중복
 * - class-period: 같은 교시면 중복
 */
export function checkDuplicateSignature(
  instructorId: string,
  courseId: string,
  date: string,
  attendanceType: string,
  additionalData?: {
    timeText?: string
    startTime?: string
    endTime?: string
    classPeriodId?: string
  }
): Signature | null {
  const signatures = getAllSignatures()

  // 같은 강사, 같은 강의, 같은 날짜의 서명 찾기
  const existingSignature = signatures.find((sig) => {
    if (
      sig.instructorId === instructorId &&
      sig.courseId === courseId &&
      sig.date === date &&
      sig.status !== 'invalidated' // 무효화된 서명은 제외
    ) {
      // 출근부 유형별 추가 체크
      if (attendanceType === 'daily-multiple') {
        // daily-multiple은 여러 번 서명 가능하므로 timeText가 같으면 중복
        return sig.timeText === additionalData?.timeText
      } else if (attendanceType === 'time-range') {
        // time-range는 여러 번 서명 가능하므로 시간이 겹치면 중복
        // 간단하게 정확히 같은 시간이면 중복으로 처리
        return (
          sig.startTime === additionalData?.startTime &&
          sig.endTime === additionalData?.endTime
        )
      } else if (attendanceType === 'class-period') {
        // class-period는 같은 교시면 중복
        return sig.classPeriodId === additionalData?.classPeriodId
      }
      return true // 기타 유형은 같은 날짜면 중복
    }
    return false
  })

  return existingSignature || null
}

/**
 * LocalStorage 초기화 (개발/테스트용)
 */
export function clearAllSignatures(): void {
  localStorage.removeItem(SIGNATURES_KEY)
}
