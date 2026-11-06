// Admin orders data (database mode only). Orders are not part of the catalogue blob - they're read live.
import { useCallback, useEffect, useState } from 'react'
import { hasBackend } from '../lib/backend'

const remote = () => import('./remote')

export function useOrders() {
  const [orders, setOrders] = useState(hasBackend ? null : [])
  const [error, setError] = useState('')
  const [fresh, setFresh] = useState(0) // count of orders that arrived while the page was open

  const load = useCallback(async () => {
    if (!hasBackend) return
    try {
      setOrders(await (await remote()).listOrders())
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    if (!hasBackend) return
    load()
    let stop = () => {}
    remote().then((r) => {
      stop = r.watchOrders((ev) => {
        if (ev.eventType === 'INSERT') setFresh((n) => n + 1)
        load()
      })
    })
    // fallback refresh in case Realtime isn't enabled for the table
    const t = setInterval(load, 60_000)
    return () => { stop(); clearInterval(t) }
  }, [load])

  return { orders, error, reload: load, fresh, clearFresh: () => setFresh(0) }
}

export const orderApi = {
  events: async (id) => (await remote()).orderEvents(id),
  setStatus: async (...a) => (await remote()).setOrderStatus(...a),
  update: async (...a) => (await remote()).updateOrder(...a),
}
