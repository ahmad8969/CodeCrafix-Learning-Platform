import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/common/footer'

/** Public marketing / auth chrome */
export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
