import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { useContent } from './content'

/**
 * Edit one section of the site content (announcement, events, contact, social,
 * page text): a local draft seeded from what is published, a dirty flag, and
 * a save that commits it and reports the commit for the live indicator.
 */
export function useSection(section, fallback) {
  const { content, reload } = useContent()
  const published = content?.site?.[section]
  const [draft, setDraft] = useState(fallback)
  const [seeded, setSeeded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (content && !seeded) {
      setDraft(published ?? fallback)
      setSeeded(true)
    }
  }, [content, published, seeded, fallback])

  const dirty = seeded && JSON.stringify(draft) !== JSON.stringify(published ?? fallback)

  const save = useCallback(
    async (value = draft) => {
      setSaving(true)
      setError(null)
      setDone(null)
      try {
        const d = await api('site-save', { section, value })
        setDraft(d.value)
        setDone({ commit: d.commit })
        await reload()
        return true
      } catch (err) {
        setError(err.message)
        return false
      } finally {
        setSaving(false)
      }
    },
    [draft, section, reload],
  )

  return { draft, setDraft, save, saving, error, done, dirty, ready: seeded }
}
