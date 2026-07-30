import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { TopNavbar } from '@/components/navbar/top-navbar'
import { CommandPalette } from '@/components/common/command-palette'
import { DocumentHead } from '@/components/common/document-head'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useSidebar } from '@/contexts/sidebar-context'

export function PortalLayout({ title, navItems, breadcrumbs }) {
  const { mobileOpen, setMobileOpen } = useSidebar()
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden">
      <DocumentHead title={title || 'Portal'} robots="noindex,nofollow" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <AppSidebar title={title} items={navItems} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <AppSidebar title={title} items={navItems} className="border-0" />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar breadcrumbs={breadcrumbs} onOpenCommand={() => setCommandOpen(true)} />
        <main id="main-content" className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
