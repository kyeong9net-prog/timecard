import { Course } from '@/types'

export const mockCourses: Course[] = [
  {
    id: 'course-001',
    name: '수학 기초',
    code: 'MATH-101',
    attendanceType: 'class-period', // 교시별 출근부
    isActive: true,
  },
  {
    id: 'course-002',
    name: '영어 회화',
    code: 'ENG-201',
    attendanceType: 'daily-multiple', // 일일 다회 출근부
    isActive: true,
  },
  {
    id: 'course-003',
    name: '과학 실험',
    code: 'SCI-301',
    attendanceType: 'time-range', // 시간대 기록 출근부
    isActive: true,
  },
  {
    id: 'course-004',
    name: '음악 이론',
    code: 'MUS-101',
    attendanceType: 'class-period', // 교시별 출근부
    isActive: true,
  },
  {
    id: 'course-005',
    name: '체육',
    code: 'PE-101',
    attendanceType: 'daily-multiple', // 일일 다회 출근부
    isActive: true,
  },
]
