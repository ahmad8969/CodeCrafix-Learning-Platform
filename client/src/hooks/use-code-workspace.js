import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { workspaceService } from '@/services/curriculum.service'
import { monacoLanguageFromPath } from '@/config/languages'
import { notify, getErrorMessage } from '@/utils/error'

export function useCodeWorkspace(lessonId, { enabled = true } = {}) {
  const queryClient = useQueryClient()
  const [files, setFiles] = useState([])
  const [activeFile, setActiveFile] = useState('index.html')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [currentVersion, setCurrentVersion] = useState(0)
  const sessionStart = useRef(Date.now())
  const lastPersist = useRef(Date.now())

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workspace', lessonId],
    queryFn: () => workspaceService.get(lessonId),
    enabled: Boolean(lessonId) && enabled,
  })

  useEffect(() => {
    if (!data?.workspace) return
    setFiles(data.workspace.files || [])
    setActiveFile(data.workspace.activeFile || data.workspace.files?.[0]?.path || 'index.html')
    setLastSavedAt(data.workspace.lastSavedAt)
    setCurrentVersion(data.workspace.currentVersion || 0)
    setDirty(false)
    sessionStart.current = Date.now()
    lastPersist.current = Date.now()
  }, [data])

  const updateFileContent = useCallback((path, content) => {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content } : f)))
    setDirty(true)
  }, [])

  const selectFile = useCallback((path) => setActiveFile(path), [])

  const addFile = useCallback((path) => {
    setFiles((prev) => {
      if (prev.some((f) => f.path === path)) return prev
      return [...prev, { path, language: monacoLanguageFromPath(path), content: '', entry: false }]
    })
    setActiveFile(path)
    setDirty(true)
  }, [])

  const save = useCallback(
    async ({ source = 'manual', label = '' } = {}) => {
      if (!lessonId) return null
      setSaving(true)
      try {
        const delta = Math.round((Date.now() - lastPersist.current) / 1000)
        lastPersist.current = Date.now()
        const saved = await workspaceService.save(lessonId, {
          files,
          activeFile,
          codingTimeDelta: Math.max(0, delta),
          source,
          label,
        })
        const ws = saved.workspace || saved
        setLastSavedAt(ws.lastSavedAt || new Date().toISOString())
        setCurrentVersion(ws.currentVersion || saved.version || currentVersion)
        setDirty(false)
        queryClient.invalidateQueries({ queryKey: ['workspace-dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['workspace-versions', lessonId] })
        return saved
      } catch (e) {
        notify.error(getErrorMessage(e))
        return null
      } finally {
        setSaving(false)
      }
    },
    [lessonId, files, activeFile, queryClient, currentVersion]
  )

  useEffect(() => {
    if (!enabled || !dirty) return undefined
    const id = setInterval(() => {
      save({ source: 'auto' })
    }, 8000)
    return () => clearInterval(id)
  }, [dirty, save, enabled])

  const reset = useCallback(async () => {
    if (!lessonId) return null
    try {
      const result = await workspaceService.reset(lessonId)
      setFiles(result.workspace?.files || result.starter || [])
      setActiveFile(
        result.workspace?.activeFile ||
          result.starter?.find((f) => f.entry)?.path ||
          'index.html'
      )
      setLastSavedAt(result.workspace?.lastSavedAt || new Date().toISOString())
      setCurrentVersion(result.workspace?.currentVersion || 0)
      setDirty(false)
      setPreviewKey((k) => k + 1)
      queryClient.invalidateQueries({ queryKey: ['workspace-versions', lessonId] })
      notify.success('Workspace reset to starter template')
      return result
    } catch (e) {
      notify.error(getErrorMessage(e))
      return null
    }
  }, [lessonId, queryClient])

  const restoreVersion = useCallback(
    async (version) => {
      if (!lessonId) return null
      try {
        const result = await workspaceService.restoreVersion(lessonId, version)
        setFiles(result.workspace?.files || [])
        setActiveFile(result.workspace?.activeFile || 'index.html')
        setLastSavedAt(result.workspace?.lastSavedAt || new Date().toISOString())
        setCurrentVersion(result.workspace?.currentVersion || 0)
        setDirty(false)
        setPreviewKey((k) => k + 1)
        queryClient.invalidateQueries({ queryKey: ['workspace-versions', lessonId] })
        notify.success(`Restored version ${version}`)
        return result
      } catch (e) {
        notify.error(getErrorMessage(e))
        return null
      }
    },
    [lessonId, queryClient]
  )

  const runPreview = useCallback(() => {
    setPreviewKey((k) => k + 1)
  }, [])

  const active = files.find((f) => f.path === activeFile) || files[0]

  return {
    isLoading,
    meta: data?.meta,
    files,
    activeFile,
    active,
    dirty,
    saving,
    lastSavedAt,
    currentVersion,
    previewKey,
    setFiles,
    updateFileContent,
    selectFile,
    addFile,
    save,
    reset,
    restoreVersion,
    runPreview,
    refetch,
  }
}
