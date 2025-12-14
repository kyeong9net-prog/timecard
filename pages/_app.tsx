import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import { OfflineProvider } from '@/contexts/OfflineContext'
import OfflineBanner from '@/components/OfflineBanner'
import SyncStatusIndicator from '@/components/SyncStatusIndicator'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <OfflineProvider>
        <OfflineBanner />
        <SyncStatusIndicator />
        <Component {...pageProps} />
      </OfflineProvider>
    </AuthProvider>
  )
}
