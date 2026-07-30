import { useEffect } from 'react'

const DEFAULT_TITLE = 'CodeCrafters Learning Platform'
const DEFAULT_DESCRIPTION =
  'Enterprise LMS for courses, assessments, live classes, finance, career, and student success.'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function DocumentHead({
  title,
  description = DEFAULT_DESCRIPTION,
  robots = 'index,follow',
  image,
  type = 'website',
  canonical,
}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · CodeCrafters` : DEFAULT_TITLE
    document.title = fullTitle
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', robots)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:image', image)
    }
    if (canonical) {
      let link = document.head.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', canonical)
    }
  }, [title, description, robots, image, type, canonical])

  return null
}
