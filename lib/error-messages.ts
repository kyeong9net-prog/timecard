/**
 * 에러 메시지 상수
 * 사용자가 이해하기 쉬운 명확한 에러 메시지와 해결 방법을 제공합니다.
 */

export const ERROR_MESSAGES = {
  // 강의 관련 에러
  INACTIVE_COURSE: {
    title: '비활성화된 강의입니다',
    message: '이 강의는 현재 비활성 상태로 서명할 수 없습니다.',
    action: '관리자에게 강의 활성화를 요청해주세요.',
  },

  // 월 마감 관련 에러
  MONTH_LOCKED: (month: string) => ({
    title: '마감된 월입니다',
    message: `${month} 월은 이미 마감되어 서명을 추가할 수 없습니다.`,
    action: '다른 월을 선택하거나 관리자에게 문의해주세요.',
  }),

  // 날짜 관련 에러
  INVALID_DATE: {
    title: '유효하지 않은 날짜입니다',
    message: '오늘 또는 관리자가 활성화한 날짜만 서명할 수 있습니다.',
    action: '날짜 선택 메뉴에서 유효한 날짜를 선택해주세요.',
  },

  // 중복 서명 에러
  DUPLICATE_SIGNATURE: (existingTime?: string) => ({
    title: '이미 서명하셨습니다',
    message: existingTime
      ? `이 강의에 이미 서명하셨습니다. (기존 서명: ${existingTime})`
      : '이 강의에 이미 서명하셨습니다.',
    action: '다른 강의를 선택하거나 월별 서명 목록을 확인해주세요.',
  }),

  // 중복 교시 에러
  DUPLICATE_PERIOD: {
    title: '이미 서명한 교시입니다',
    message: '이 교시에는 이미 서명하셨습니다.',
    action: '다른 교시를 선택해주세요.',
  },

  // 일반 저장 에러
  SAVE_ERROR: {
    title: '서명 저장 실패',
    message: '서명 저장 중 오류가 발생했습니다.',
    action: '잠시 후 다시 시도하거나 관리자에게 문의해주세요.',
  },

  // 필수 입력 에러
  REQUIRED_TIME: {
    title: '시간 입력이 필요합니다',
    message: '강의 시간 또는 실제 강의 시간을 입력해주세요.',
    action: '위의 시간 정보 입력 영역에서 시간을 선택해주세요.',
  },

  REQUIRED_PERIOD: {
    title: '교시 선택이 필요합니다',
    message: '강의 교시를 선택해주세요.',
    action: '위의 교시 선택 영역에서 교시를 선택해주세요.',
  },

  // 네트워크 관련 에러
  OFFLINE_MODE: {
    title: '오프라인 모드',
    message: '현재 인터넷 연결이 끊어져 있습니다.',
    action: '서명은 임시 저장되며, 인터넷 연결 시 자동으로 동기화됩니다.',
  },

  // 시간 차이 경고
  TIME_DIFFERENCE_WARNING: (diffMinutes: number) => ({
    title: '시간 차이 알림',
    message: `현재 시각과 ${diffMinutes}분 차이가 있습니다.`,
    action: '서명 시각이 정확한지 확인해주세요.',
  }),
}

/**
 * 에러 메시지 포맷팅 함수
 * ErrorMessage 객체를 문자열로 변환
 */
export function formatErrorMessage(error: {
  title: string
  message: string
  action?: string
}): string {
  if (error.action) {
    return `${error.message}\n\n${error.action}`
  }
  return error.message
}

/**
 * 에러 객체를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return ERROR_MESSAGES.SAVE_ERROR.message
}
