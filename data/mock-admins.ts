import { Admin } from '@/types'

/**
 * Mock 관리자 계정 데이터
 * 실제 프로덕션에서는 비밀번호를 평문으로 저장하지 않습니다.
 */
export const mockAdmins: Admin[] = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin123', // 개발용 평문 비밀번호
    name: '김관리',
    role: 'admin',
  },
  {
    id: 'admin-002',
    username: 'superadmin',
    password: 'super123',
    name: '이슈퍼',
    role: 'super-admin',
  },
]

/**
 * 관리자 인증
 */
export function authenticateAdmin(
  username: string,
  password: string
): Admin | null {
  const admin = mockAdmins.find(
    (a) => a.username === username && a.password === password
  )
  return admin || null
}

/**
 * ID로 관리자 조회
 */
export function getAdminById(id: string): Admin | null {
  return mockAdmins.find((a) => a.id === id) || null
}
