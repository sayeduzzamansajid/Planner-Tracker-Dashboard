import { auth } from './firebase'

async function call(method, body) {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  const token = await user.getIdToken()
  const res = await fetch('/api/state', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const loadState = () => call('GET')
export const saveState = (state, baseVersion) => call('PUT', { state, baseVersion })
export const deleteState = () => call('DELETE')
