import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { I18nProvider } from '@/i18n'

export function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ThemeProvider defaultTheme="dark">
            <AuthProvider>
              <SidebarProvider>
                <TooltipProvider delayDuration={200}>
                  <BrowserRouter>
                    {children}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        className:
                          '!bg-card !text-foreground !border !border-border !shadow-elevation-2 !rounded-xl',
                        duration: 3500,
                      }}
                    />
                  </BrowserRouter>
                </TooltipProvider>
              </SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
