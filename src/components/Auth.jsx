import { useState } from 'react'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

const msg = e => ({
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/email-already-in-use': 'That email already has an account. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
}[e.code] || e.message)

export default function Auth() {
  const [mode, setMode] = useState('in')
  const [err, setErr] = useState(''), [info, setInfo] = useState(''), [busy, setBusy] = useState(false)

  const run = async fn => { setErr(''); setInfo(''); setBusy(true); try { await fn() } catch (e) { setErr(msg(e)) } finally { setBusy(false) } }
  const submit = e => {
    e.preventDefault()
    const f = new FormData(e.currentTarget), email = f.get('email').trim(), pw = f.get('pw')
    run(() => (mode === 'in' ? signInWithEmailAndPassword(auth, email, pw) : createUserWithEmailAndPassword(auth, email, pw)))
  }
  const reset = e => {
    const email = e.currentTarget.form.email.value.trim()
    if (!email) return setErr('Enter your email first.')
    run(async () => { await sendPasswordResetEmail(auth, email); setInfo('Password reset email sent.') })
  }

  return (
    <div className="auth">
      <form className="c" onSubmit={submit}>
        <h1><span>☑</span> Master Progress Dashboard</h1>
        <p className="mu" style={{ margin: 0 }}>{mode === 'in' ? 'Sign in to see your planner on any device.' : 'Create an account to save your planner.'}</p>
        <button type="button" className="pb o" disabled={busy} onClick={() => run(() => signInWithPopup(auth, googleProvider))}>Continue with Google</button>
        <input name="email" type="email" placeholder="Email" autoComplete="email" required />
        <input name="pw" type="password" placeholder="Password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={6} required />
        {err && <div className="err">{err}</div>}{info && <div className="mu">{info}</div>}
        <button className="pb" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <div className="fr" style={{ justifyContent: 'space-between', margin: 0 }}>
          <button type="button" className="lk" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr('') }}>{mode === 'in' ? 'Create an account' : 'I already have an account'}</button>
          {mode === 'in' && <button type="button" className="lk" onClick={reset}>Forgot password?</button>}
        </div>
      </form>
    </div>
  )
}
