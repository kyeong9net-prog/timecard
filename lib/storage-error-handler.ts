/**
 * LocalStorage 에러 처리 유틸리티 (Phase 10)
 */

export interface StorageError {
  type: 'quota_exceeded' | 'access_denied' | 'unknown'
  message: string
  originalError?: Error
}

/**
 * LocalStorage setItem 안전 래퍼
 */
export function safeSetItem(key: string, value: string): StorageError | null {
  try {
    localStorage.setItem(key, value)
    return null
  } catch (error) {
    if (error instanceof Error) {
      // 용량 초과 에러
      if (error.name === 'QuotaExceededError') {
        return {
          type: 'quota_exceeded',
          message:
            '저장 공간이 부족합니다. 오래된 데이터를 삭제하거나 브라우저 캐시를 정리해주세요.',
          originalError: error,
        }
      }

      // 접근 권한 에러 (프라이빗 브라우징 등)
      if (error.name === 'SecurityError') {
        return {
          type: 'access_denied',
          message:
            '브라우저 저장소에 접근할 수 없습니다. 프라이빗 브라우징 모드를 해제하거나 브라우저 설정을 확인해주세요.',
          originalError: error,
        }
      }

      // 기타 에러
      return {
        type: 'unknown',
        message: `데이터 저장 중 오류가 발생했습니다: ${error.message}`,
        originalError: error,
      }
    }

    return {
      type: 'unknown',
      message: '알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * LocalStorage getItem 안전 래퍼
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error('LocalStorage 읽기 실패:', error)
    return null
  }
}

/**
 * LocalStorage removeItem 안전 래퍼
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('LocalStorage 삭제 실패:', error)
  }
}

/**
 * LocalStorage 사용 가능 여부 체크
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

/**
 * LocalStorage 사용량 계산 (대략적)
 */
export function getLocalStorageUsage(): {
  used: number
  total: number
  percentage: number
} {
  let totalSize = 0

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const itemSize = localStorage.getItem(key)?.length || 0
        totalSize += key.length + itemSize
      }
    }

    // 대부분의 브라우저에서 LocalStorage 제한은 5MB
    const totalLimit = 5 * 1024 * 1024 // 5MB in bytes
    const percentage = (totalSize / totalLimit) * 100

    return {
      used: totalSize,
      total: totalLimit,
      percentage: Math.round(percentage * 100) / 100,
    }
  } catch (error) {
    console.error('저장소 사용량 계산 실패:', error)
    return {
      used: 0,
      total: 5 * 1024 * 1024,
      percentage: 0,
    }
  }
}

/**
 * 용량 초과 위험 여부 체크
 */
export function isStorageNearLimit(): boolean {
  const usage = getLocalStorageUsage()
  return usage.percentage >= 80
}

/**
 * 사람이 읽기 쉬운 용량 포맷
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
