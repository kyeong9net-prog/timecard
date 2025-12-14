/**
 * 시간 관련 유틸리티 함수
 * KST (UTC+9) 기준으로 날짜와 시간을 처리합니다.
 */

/**
 * 현재 KST 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getCurrentDateKST(): string {
  const now = new Date()
  const kstOffset = 9 * 60 // KST는 UTC+9
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)

  const year = kstTime.getUTCFullYear()
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kstTime.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 현재 KST 시각을 ISO 8601 형식으로 반환
 */
export function getCurrentTimestampKST(): string {
  const now = new Date()
  const kstOffset = 9 * 60
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)

  return kstTime.toISOString()
}

/**
 * 날짜가 오늘인지 확인 (KST 기준)
 */
export function isToday(dateString: string): boolean {
  const today = getCurrentDateKST()
  return dateString === today
}

/**
 * 날짜 문자열을 사람이 읽기 쉬운 형식으로 변환
 * @param dateString - YYYY-MM-DD 형식
 * @returns YYYY년 MM월 DD일
 */
export function formatDateKorean(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`
}

/**
 * ISO 8601 타임스탬프를 사람이 읽기 쉬운 형식으로 변환
 * @param timestamp - ISO 8601 형식
 * @returns YYYY-MM-DD HH:mm:ss
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const kstOffset = 9 * 60
  const kstTime = new Date(date.getTime() + kstOffset * 60 * 1000)

  const year = kstTime.getUTCFullYear()
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kstTime.getUTCDate()).padStart(2, '0')
  const hours = String(kstTime.getUTCHours()).padStart(2, '0')
  const minutes = String(kstTime.getUTCMinutes()).padStart(2, '0')
  const seconds = String(kstTime.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
