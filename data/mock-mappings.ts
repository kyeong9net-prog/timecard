import { InstructorCourseMapping } from '@/types'

// 강사-강의 매핑 관계
export const mockInstructorCourseMappings: InstructorCourseMapping[] = [
  {
    instructorId: 'inst-001', // 김영희
    courseIds: ['course-001', 'course-002'], // 수학 기초, 영어 회화
  },
  {
    instructorId: 'inst-002', // 이철수
    courseIds: ['course-003', 'course-004'], // 과학 실험, 음악 이론
  },
  {
    instructorId: 'inst-003', // 박민수
    courseIds: ['course-005'], // 체육
  },
]
