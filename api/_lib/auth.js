import admin from 'firebase-admin'

function app() {
  if (admin.apps.length) return admin.app()
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  })
}

/** Returns the Firebase uid for a valid "Authorization: Bearer <idToken>" header, else null. */
export async function verify(req) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return null
  try {
    const dec = await app().auth().verifyIdToken(token)
    return dec.uid
  } catch {
    return null
  }
}
