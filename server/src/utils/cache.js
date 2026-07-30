/**
 * Lightweight in-memory response cache — Redis-ready interface.
 */
const store = new Map()

function get(key) {
  const hit = store.get(key)
  if (!hit) return null
  if (hit.expiresAt && hit.expiresAt < Date.now()) {
    store.delete(key)
    return null
  }
  return hit.value
}

function set(key, value, ttlMs = 30_000) {
  store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null })
  return value
}

function del(key) {
  store.delete(key)
}

function wrap(key, ttlMs, loader) {
  const cached = get(key)
  if (cached !== null) return Promise.resolve(cached)
  return Promise.resolve(loader()).then((value) => set(key, value, ttlMs))
}

module.exports = { get, set, del, wrap }
