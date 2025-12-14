/**
 * 오프라인 서명 저장 유틸리티
 * 네트워크 단절 시 서명을 임시 저장하고 관리합니다.
 */

import { Signature } from '@/types'

const OFFLINE_SIGNATURES_KEY = 'offline_signatures'
const MAX_OFFLINE_SIGNATURES = 50

/**
 * 오프라인 서명 저장
 * 최대 50건까지만 저장 가능
 */
export function saveOfflineSignature(signature: Signature): void {
  try {
    const signatures = getOfflineSignatures()

    // 50건 초과 체크
    if (signatures.length >= MAX_OFFLINE_SIGNATURES) {
      throw new Error(
        `오프라인 서명은 최대 ${MAX_OFFLINE_SIGNATURES}건까지만 저장할 수 있습니다. 네트워크 연결 후 동기화를 완료해주세요.`
      )
    }

    // syncStatus를 'pending'으로 설정
    const offlineSignature: Signature = {
      ...signature,
      syncStatus: 'pending',
    }

    signatures.push(offlineSignature)
    localStorage.setItem(OFFLINE_SIGNATURES_KEY, JSON.stringify(signatures))
  } catch (error) {
    console.error('오프라인 서명 저장 실패:', error)
    throw error
  }
}

/**
 * 오프라인 서명 목록 조회
 */
export function getOfflineSignatures(): Signature[] {
  try {
    const data = localStorage.getItem(OFFLINE_SIGNATURES_KEY)
    if (!data) return []
    return JSON.parse(data) as Signature[]
  } catch (error) {
    console.error('오프라인 서명 조회 실패:', error)
    return []
  }
}

/**
 * 오프라인 서명 저장소 정리
 */
export function clearOfflineSignatures(): void {
  try {
    localStorage.removeItem(OFFLINE_SIGNATURES_KEY)
  } catch (error) {
    console.error('오프라인 서명 정리 실패:', error)
  }
}

/**
 * 대기 중인 오프라인 서명 개수 조회
 */
export function getOfflineSignatureCount(): number {
  const signatures = getOfflineSignatures()
  return signatures.filter((sig) => sig.syncStatus === 'pending').length
}

/**
 * 특정 오프라인 서명 제거
 */
export function removeOfflineSignature(signatureId: string): void {
  try {
    const signatures = getOfflineSignatures()
    const filtered = signatures.filter((sig) => sig.id !== signatureId)
    localStorage.setItem(OFFLINE_SIGNATURES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('오프라인 서명 제거 실패:', error)
  }
}

/**
 * 오프라인 서명 상태 업데이트
 */
export function updateOfflineSignatureStatus(
  signatureId: string,
  syncStatus: 'synced' | 'failed'
): void {
  try {
    const signatures = getOfflineSignatures()
    const signature = signatures.find((sig) => sig.id === signatureId)
    if (signature) {
      signature.syncStatus = syncStatus
      localStorage.setItem(OFFLINE_SIGNATURES_KEY, JSON.stringify(signatures))
    }
  } catch (error) {
    console.error('오프라인 서명 상태 업데이트 실패:', error)
  }
}

/**
 * 실패한 오프라인 서명 목록 조회
 */
export function getFailedOfflineSignatures(): Signature[] {
  const signatures = getOfflineSignatures()
  return signatures.filter((sig) => sig.syncStatus === 'failed')
}
