// 출근부 유형
export type AttendanceType = 'daily-multiple' | 'time-range' | 'class-period'

// 관리자 타입
export interface Admin {
  id: string
  username: string
  password: string
  name: string
  role: 'admin' | 'super-admin' | 'approver'
}

// 강사 타입
export interface Instructor {
  id: string
  name: string
  isActive: boolean
}

// 강의 타입 (수정: attendanceType 추가)
export interface Course {
  id: string
  name: string
  code: string
  attendanceType: AttendanceType // 출근부 유형 (관리자가 지정)
  isActive: boolean
}

// 교시 정보 (유형3: class-period용)
export interface ClassPeriod {
  id: string
  name: string // "1교시", "2교시" 등
  startTime: string // "09:00"
  endTime: string // "09:50"
  order: number // 정렬 순서
}

// 강사-강의 매핑 타입
export interface InstructorCourseMapping {
  instructorId: string
  courseIds: string[]
}

// 서명 상태 타입
export type SignatureStatus = 'normal' | 'activated' | 'invalidated'

// 서명 타입 (대폭 확장)
export interface Signature {
  id: string
  instructorId: string
  instructorName: string
  courseId: string
  courseName: string
  date: string // YYYY-MM-DD format
  timestamp: string // ISO 8601 format
  imageData: string // SVG or PNG string
  status: SignatureStatus

  // 유형별 추가 정보 (optional)
  timeText?: string // 유형1 (daily-multiple): 자유 텍스트 (예: "2시간", "14:00-16:00")
  startTime?: string // 유형2 (time-range): 시작 시간 (HH:mm)
  endTime?: string // 유형2 (time-range): 종료 시간 (HH:mm)
  classPeriodId?: string // 유형3 (class-period): 교시 ID
}

// 활성화된 날짜 타입
export interface ActivatedDate {
  id: string
  instructorId: string
  instructorName: string
  courseId: string
  courseName: string
  date: string // YYYY-MM-DD format
  reason: string // 활성화 사유
  activatedBy: string // 활성화한 관리자 ID
  activatedByName: string // 활성화한 관리자 이름
  activatedAt: string // 활성화 시각 (ISO 8601)
}

// 관리자 행위 로그 타입
export type AdminActionType =
  | 'activate_date' // 날짜 활성화
  | 'invalidate_signature' // 서명 무효화
  | 'login' // 로그인
  | 'logout' // 로그아웃
  | 'lock_month' // 월 마감
  | 'unlock_month' // 월 마감 해제

export interface AdminLog {
  id: string
  adminId: string
  adminName: string
  action: AdminActionType
  targetType?: string // 대상 유형 (instructor, course, signature 등)
  targetId?: string // 대상 ID
  targetName?: string // 대상 이름
  reason?: string // 사유
  timestamp: string // ISO 8601 format
  details?: Record<string, unknown> // 추가 상세 정보
}

// 확인자 서명 타입
export interface ApproverSignature {
  id: string
  approverId: string
  approverName: string
  month: string // YYYY-MM format
  imageData: string // Canvas 서명 이미지
  timestamp: string // ISO 8601 format
}

// 월 마감 타입
export interface MonthLock {
  id: string
  month: string // YYYY-MM format
  lockedBy: string // 확인자 또는 관리자 ID
  lockedByName: string
  lockedAt: string // ISO 8601 format
  approverSignatureId?: string // 확인자 서명 ID (있는 경우)
}
