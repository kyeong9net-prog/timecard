// 출근부 유형
export type AttendanceType = 'daily-multiple' | 'time-range' | 'class-period'

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
