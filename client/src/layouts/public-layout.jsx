import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/common/footer'
import { DocumentHead } from '@/components/common/document-head'

/** Public marketing / auth chrome */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <DocumentHead title="CodeCrafters" robots="index,follow" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <div id="main-content" className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
