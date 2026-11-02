import { verify } from './_lib/auth.js'
import { getDb } from './_lib/mongo.js'

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } }

// One document per user: { _id: <firebase uid>, state: {...planner data}, version, updatedAt }
export default async function handler(req, res) {
  try {
    const uid = await verify(req)
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })
    const col = (await getDb()).collection('planners')

    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: uid })
      return res.status(200).json(doc ? { state: doc.state, version: doc.version, updatedAt: doc.updatedAt } : { state: null, version: 0 })
    }

    if (req.method === 'PUT') {
      const { state, baseVersion } = req.body || {}
      if (!state || typeof state !== 'object' || Array.isArray(state)) return res.status(400).json({ error: 'Invalid state' })
      // Basic shape check so a bad client can't store junk.
      for (const k of ['ar', 'tpl', 'tk', 'gl', 'ev', 'df']) {
        if (!Array.isArray(state[k])) return res.status(400).json({ error: `state.${k} must be an array` })
      }
      const cur = await col.findOne({ _id: uid }, { projection: { version: 1 } })
      const curV = cur?.version || 0
      // Optimistic concurrency: another device saved since this client last synced.
      if (typeof baseVersion === 'number' && baseVersion !== curV) {
        return res.status(409).json({ error: 'Version conflict', version: curV })
      }
      const version = curV + 1
      await col.replaceOne({ _id: uid }, { _id: uid, state, version, updatedAt: new Date() }, { upsert: true })
      return res.status(200).json({ version })
    }

    if (req.method === 'DELETE') {
      await col.deleteOne({ _id: uid })
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}
