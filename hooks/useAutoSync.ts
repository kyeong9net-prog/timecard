/**
 * 자동 동기화 훅
 * 온라인 복구 감지 시 자동으로 오프라인 서명을 동기화합니다.
 */

import { useState, useEffect, useCallback } from 'react'
import { useOffline } from '@/contexts/OfflineContext'
import { syncOfflineSignatures, SyncResult } from '@/lib/sync-utils'
import { getOfflineSignatureCount } from '@/lib/offline-storage-utils'

export interface SyncStatus {
  isSyncing: boolean
  syncResult: SyncResult | null
  hasCompleted: boolean
}

export function useAutoSync() {
  const { isOffline } = useOffline()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    syncResult: null,
    hasCompleted: false,
  })
  const [pendingCount, setPendingCount] = useState<number>(0)

  // 대기 중인 서명 개수 업데이트
  useEffect(() => {
    const updateCount = () => {
      setPendingCount(getOfflineSignatureCount())
    }

    updateCount()

    // 1초마다 업데이트 (실시간 반영)
    const interval = setInterval(updateCount, 1000)

    return () => clearInterval(interval)
  }, [])

  // 온라인 복구 시 자동 동기화
  useEffect(() => {
    let isMounted = true

    const performSync = async () => {
      // 이미 동기화 중이거나 오프라인이면 중단
      if (syncStatus.isSyncing || isOffline) return

      // 대기 중인 서명이 없으면 중단
      const count = getOfflineSignatureCount()
      if (count === 0) return

      // 동기화 시작
      setSyncStatus({
        isSyncing: true,
        syncResult: null,
        hasCompleted: false,
      })

      try {
        const result = await syncOfflineSignatures()

        if (isMounted) {
          setSyncStatus({
            isSyncing: false,
            syncResult: result,
            hasCompleted: true,
          })

          // 개수 업데이트
          setPendingCount(getOfflineSignatureCount())

          // 3초 후 완료 상태 초기화
          setTimeout(() => {
            if (isMounted) {
              setSyncStatus((prev) => ({
                ...prev,
                hasCompleted: false,
              }))
            }
          }, 3000)
        }
      } catch (error) {
        console.error('동기화 오류:', error)
        if (isMounted) {
          setSyncStatus({
            isSyncing: false,
            syncResult: null,
            hasCompleted: false,
          })
        }
      }
    }

    // 오프라인에서 온라인으로 전환되었을 때만 동기화
    if (!isOffline && pendingCount > 0) {
      performSync()
    }

    return () => {
      isMounted = false
    }
  }, [isOffline]) // pendingCount와 syncStatus.isSyncing은 의존성에서 제외 (무한 루프 방지)

  // 수동 재시도
  const retrySync = useCallback(async () => {
    setSyncStatus({
      isSyncing: true,
      syncResult: null,
      hasCompleted: false,
    })

    try {
      const result = await syncOfflineSignatures()

      setSyncStatus({
        isSyncing: false,
        syncResult: result,
        hasCompleted: true,
      })

      setPendingCount(getOfflineSignatureCount())

      // 3초 후 완료 상태 초기화
      setTimeout(() => {
        setSyncStatus((prev) => ({
          ...prev,
          hasCompleted: false,
        }))
      }, 3000)
    } catch (error) {
      console.error('동기화 재시도 오류:', error)
      setSyncStatus({
        isSyncing: false,
        syncResult: null,
        hasCompleted: false,
      })
    }
  }, [])

  return {
    ...syncStatus,
    pendingCount,
    retrySync,
  }
}
