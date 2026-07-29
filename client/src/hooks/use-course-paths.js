import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants'

export function useCoursesBasePath() {
  const { pathname } = useLocation()
  return useMemo(() => {
    if (pathname.startsWith(ROUTES.SUPER_ADMIN)) return `${ROUTES.SUPER_ADMIN}/courses`
    if (pathname.startsWith(ROUTES.TEACHER)) return `${ROUTES.TEACHER}/courses`
    if (pathname.startsWith(ROUTES.STUDENT)) return `${ROUTES.STUDENT}/learn`
    return `${ROUTES.ADMIN}/courses`
  }, [pathname])
}

export function useCategoriesBasePath() {
  const { pathname } = useLocation()
  return useMemo(() => {
    if (pathname.startsWith(ROUTES.SUPER_ADMIN)) return `${ROUTES.SUPER_ADMIN}/categories`
    return `${ROUTES.ADMIN}/categories`
  }, [pathname])
}

export function useBatchesBasePath() {
  const { pathname } = useLocation()
  return useMemo(() => {
    if (pathname.startsWith(ROUTES.SUPER_ADMIN)) return `${ROUTES.SUPER_ADMIN}/batches`
    return `${ROUTES.ADMIN}/batches`
  }, [pathname])
}
