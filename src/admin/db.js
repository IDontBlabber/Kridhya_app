// Tiny IndexedDB key-value wrapper. IndexedDB (not localStorage) because uploaded photos are stored as data URLs
// and quickly outgrow localStorage's ~5 MB limit.
// SUPABASE: this whole file is the persistence boundary - replace get/set with Supabase table reads/writes
// (and image uploads with Supabase Storage) and the rest of the admin keeps working unchanged.

const DB = 'kridhya-admin'
const STORE = 'kv'

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'))
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run(mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const dbGet = (key) => run('readonly', (s) => s.get(key)).catch(() => undefined)
export const dbSet = (key, value) => run('readwrite', (s) => s.put(value, key))
export const dbDel = (key) => run('readwrite', (s) => s.delete(key))
