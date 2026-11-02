import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState } from './api'
import { makeSel } from './selectors'
import { demoData } from './demo'
import { PN, T0, fd, iso, makeDefault, nextOf, normalize, uid, ws, todayISO } from './utils'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const initV = () => {
  const day = iso(T0)
  return { tab: 'd', ym: day.slice(0, 7), day, wk: ws(day), dw: null, yr: T0.getFullYear(), more: false, mx: false, as: 'm', open: {}, fl: false, fk: 'e' }
}

export function AppProvider({ user, children }) {
  const [S, setS] = useState(null)
  const [sync, setSync] = useState('load') // load | ok | sv | er
  const [conflict, setConflict] = useState(false)
  const [V, setVraw] = useState(initV)
  const [dlg, setDlg] = useState(null)
  const [edit, setEdit] = useState(null)
  const [cx, setCx] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [, setTick] = useState(0)

  const SRef = useRef(null), verRef = useRef(0), timer = useRef(null), dirty = useRef(false)
  const cacheKey = 'planner1:' + user.uid

  /* ---------- load ---------- */
  useEffect(() => {
    let dead = false
    const adopt = (raw, ver, push) => {
      const n = normalize(raw)
      // Existing real data should never trigger the "welcome / demo" picker.
      if (!n.demo && (n.tk.length || n.gl.length || n.ev.length)) n.demo = 'own'
      SRef.current = n; verRef.current = ver || 0
      if (dead) return
      setS(n); setSync(push ? 'sv' : 'ok')
      if (push) { dirty.current = true; schedule(0) }
    }
    ;(async () => {
      try {
        const r = await loadState()
        if (r.state) return adopt(r.state, r.version, false)
        // First login on this account: migrate old single-file localStorage data if present.
        let legacy = null
        try { legacy = JSON.parse(localStorage.getItem('planner1') || localStorage.getItem(cacheKey) || 'null') } catch {}
        adopt(legacy, 0, !!legacy)
      } catch (e) {
        let cached = null
        try { cached = JSON.parse(localStorage.getItem(cacheKey) || 'null') } catch {}
        adopt(cached, 0, false)
        if (!dead) setSync('er')
      }
    })()
    return () => { dead = true }
    // eslint-disable-next-line
  }, [user.uid])

  /* ---------- save (debounced) ---------- */
  const flush = useCallback(async (force) => {
    if (!dirty.current || !SRef.current) return
    dirty.current = false
    setSync('sv')
    try {
      const r = await saveState(SRef.current, force ? undefined : verRef.current)
      verRef.current = r.version
      setSync(dirty.current ? 'sv' : 'ok')
    } catch (e) {
      dirty.current = true
      if (e.status === 409) { setConflict(true); setSync('er') } else setSync('er')
    }
  }, [])
  const schedule = useCallback((ms = 700) => { clearTimeout(timer.current); timer.current = setTimeout(() => flush(false), ms) }, [flush])

  useEffect(() => {
    const h = () => { if (document.visibilityState === 'hidden' && dirty.current) { clearTimeout(timer.current); flush(false) } }
    document.addEventListener('visibilitychange', h)
    const t = setInterval(() => setTick(x => x + 1), 60000) // refresh "now" highlights
    return () => { document.removeEventListener('visibilitychange', h); clearInterval(t) }
  }, [flush])

  const commit = useCallback(next => {
    SRef.current = next; dirty.current = true
    setS(next)
    try { localStorage.setItem(cacheKey, JSON.stringify(next)) } catch {}
    schedule()
  }, [cacheKey, schedule])

  /** Mutate a deep copy of the state; fn may return false to cancel. */
  const mutate = useCallback(fn => {
    const next = structuredClone(SRef.current)
    if (fn(next) === false) return false
    commit(next)
  }, [commit])

  const resolveConflict = async keepLocal => {
    setConflict(false)
    if (keepLocal) { dirty.current = true; await flush(true) }
    else {
      try {
        const r = await loadState()
        const n = normalize(r.state); SRef.current = n; verRef.current = r.version; dirty.current = false
        setS(n); setSync('ok')
      } catch { setSync('er') }
    }
  }

  /* ---------- UI helpers ---------- */
  const setV = useCallback(p => setVraw(v => ({ ...v, ...(typeof p === 'function' ? p(v) : p) })), [])
  const toast = m => { setToastMsg(m); clearTimeout(window._tt); window._tt = setTimeout(() => setToastMsg(''), 2600) }
  const ask = (ic, title, text, fn, danger) => setDlg({ ic, title, text, fn, danger })
  const closeDlg = () => setDlg(null)
  const setM = m => setV({ ym: m, day: m === iso(T0).slice(0, 7) ? iso(T0) : m + '-01', dw: null })
  const goDay = d => setV({ day: d, ym: d.slice(0, 7), dw: null })

  const sel = useMemo(() => (S ? makeSel(S) : null), [S])

  /* ---------- actions (ported from the original ACT table) ---------- */
  const A = {
    toggleTask(p) {
      const df = p.includes('|'), t = df ? null : S.tk.find(x => x.id === p)
      const on = df ? !!S.dx[p] : t.x
      const name = df ? (S.df.find(x => x.id === p.split('|')[0]) || {}).t || '' : t.t
      ask(on ? 'w' : 'q', on ? 'Mark as not completed?' : 'Mark as completed?', name, () =>
        mutate(s => { if (df) s.dx[p] = !s.dx[p]; else { const x = s.tk.find(y => y.id === p); x.x = !x.x } }))
    },
    toggleGoal(id) {
      const g = S.gl.find(x => x.id === id), on = g.cu >= g.tg
      ask(on ? 'w' : 'q', on ? 'Reset this target?' : 'Mark target as complete?', g.t, () =>
        mutate(s => { const x = s.gl.find(y => y.id === id); x.cu = on ? 0 : x.tg }))
    },
    setGoalCurrent(id, v) { mutate(s => { s.gl.find(x => x.id === id).cu = Math.max(0, +v || 0) }) },
    togglePrayer(k) {
      const day = V.day, on = ((S.pr.d[day] || 0) >> k) & 1
      ask(on ? 'w' : 'q', on ? 'Mark ' + PN[k] + ' as not prayed?' : 'Mark ' + PN[k] + ' as prayed?', fd(day, { weekday: 'short', day: 'numeric', month: 'short' }), () =>
        mutate(s => { s.pr.d[day] = (s.pr.d[day] || 0) ^ (1 << k) }))
    },
    toggleImportant(id) { mutate(s => { if (s.im[id]) delete s.im[id]; else s.im[id] = 1 }) },
    moveTask(id) {
      const t = S.tk.find(x => x.id === id)
      if (!t || t.x) return
      const today = todayISO(), tom = nextOf(today), to = t.d < today ? today : nextOf(t.d)
      ask('q', 'Move to ' + (to === today ? 'today' : to === tom ? 'tomorrow' : 'the next day') + '?',
        '"' + t.t + '" will appear at the top of ' + fd(to, { weekday: 'long', day: 'numeric', month: 'short' }) + '.', () => {
          mutate(s => { const x = s.tk.find(y => y.id === id); x.mf = x.d; x.d = to })
          toast('Moved to ' + fd(to, { weekday: 'short', day: 'numeric', month: 'short' }))
        })
    },
    remove(key) {
      const [t, id] = key.split('|')
      let ti, tx
      if (t === 't') { const o = S.tk.find(x => x.id === id); if (!o) return; ti = 'Delete this task?'; tx = o.t }
      else if (t === 'g') { const o = S.gl.find(x => x.id === id); if (!o) return; ti = 'Delete this target?'; tx = o.t }
      else if (t === 'e') { const o = S.ev.find(x => x.id === id); if (!o) return; ti = 'Delete this ' + ({ x: 'exam', a: 'assignment' }[o.k] || 'event') + '?'; tx = o.n }
      else { const o = S.df.find(x => x.id === id); if (!o) return; ti = 'Delete this default task?'; tx = o.t + ' (all its days and tracking will be removed)' }
      ask('w', ti, tx, () => {
        mutate(s => {
          if (t === 't') { s.tk = s.tk.filter(x => x.id !== id); delete s.im[id] }
          else if (t === 'g') s.gl = s.gl.filter(x => x.id !== id)
          else if (t === 'e') s.ev = s.ev.filter(x => x.id !== id)
          else {
            s.df = s.df.filter(x => x.id !== id)
            Object.keys(s.dx).forEach(k => { if (k.startsWith(id + '|')) delete s.dx[k] })
            Object.keys(s.im).forEach(k => { if (k.startsWith(id + '|')) delete s.im[k] })
          }
        })
        setEdit(null)
      }, true)
    },
    saveEdit(key, f) {
      const [t, id] = key.split('|')
      if (!f.t) return false
      if (t === 'e' && !f.d) return false
      mutate(s => {
        if (t === 't') {
          Object.assign(s.tk.find(x => x.id === id), { s: f.s, e: f.e || f.s, a: f.a, t: f.t })
          if (f.im) s.im[id] = 1; else delete s.im[id]
        } else if (t === 'g') Object.assign(s.gl.find(x => x.id === id), { t: f.t, tg: Math.max(1, +f.g || 1), cu: Math.max(0, +f.c || 0), u: f.u, a: f.a })
        else if (t === 'e') Object.assign(s.ev.find(x => x.id === id), { n: f.t, t: f.d + 'T' + (f.h || '09:00'), r: f.r, k: f.k || 'e' })
        else { const o = s.df.find(x => x.id === id); Object.assign(o, { s: f.s, e: f.e || f.s, a: f.a, t: f.t, f: f.f || o.f, u: f.x || o.u }) }
      })
      setEdit(null)
    },
    addTask(f) {
      if (!f.t || !f.s) { toast('Add a start time and a task'); return false }
      mutate(s => { const id = uid(); s.tk.push({ id, d: V.day, s: f.s, e: f.e || f.s, a: f.a, t: f.t, x: false }); if (f.im) s.im[id] = 1 })
    },
    initMonth(days) {
      const [Y, M] = V.ym.split('-').map(Number)
      const go = () => mutate(s => {
        for (let d = 1; d <= new Date(Y, M, 0).getDate(); d++) {
          const dt = new Date(Y, M - 1, d)
          if (days.includes(dt.getDay())) s.tpl.forEach(q => s.tk.push({ id: uid(), d: iso(dt), s: q.s, e: q.e, a: q.a, t: q.t, x: false }))
        }
      })
      if (S.tk.some(x => x.d.startsWith(V.ym))) ask('q', 'Add the template again?', 'Tasks already exist this month.', go)
      else go()
    },
    addGoal(l, p, f) {
      if (!f.t) { toast('Add a target or task name'); return false }
      mutate(s => { s.gl.push({ id: uid(), l, p, t: f.t, a: f.a, tg: Math.max(1, +f.g || 1), cu: 0, u: f.u }) })
    },
    addEvent(f) {
      if (!f.t || !f.d) { toast('Add a name and a date'); return false }
      mutate(s => { s.ev.push({ id: uid(), n: f.t, t: f.d + 'T' + (f.h || '09:00'), r: f.r, k: f.k || 'e' }) })
      setV({ fl: false })
    },
    addArea(f) { if (!f.n) return false; mutate(s => { s.ar.push({ id: uid(), n: f.n, c: f.c }) }) },
    removeArea(id) {
      if (S.ar.length < 2) { toast('Keep at least one area'); return }
      const a = S.ar.find(x => x.id === id)
      ask('w', 'Delete this area?', (a ? a.n : '') + ': its tasks stay but lose their label.', () => mutate(s => { s.ar = s.ar.filter(x => x.id !== id) }), true)
    },
    addTpl(f) { if (!f.t) return false; mutate(s => { s.tpl.push({ s: f.s, e: f.e, a: f.a, t: f.t }); s.tpl.sort((a, b) => (a.s < b.s ? -1 : 1)) }) },
    removeTpl(i) {
      const q = S.tpl[i]; if (!q) return
      ask('w', 'Remove this template block?', q.s + '-' + q.e + ' ' + q.t, () => mutate(s => { s.tpl.splice(i, 1) }), true)
    },
    addDefault(f, w) {
      if (!f.t || !f.f || !f.x) { toast('Add a task, a start date and an end date'); return false }
      mutate(s => { s.df.push({ id: uid(), s: f.s, e: f.e || f.s, a: f.a, t: f.t, f: f.f, u: f.x, w: w.length ? w : [0,1,2,3,4,5,6] }) })
    },
    stopDefault(id) { mutate(s => { s.df.find(x => x.id === id).u = iso(T0) }) },
    setPrayerRegion(v) { mutate(s => { s.pr.reg = v }) },
    setPrayerAsr(v) { mutate(s => { s.pr.asr = v }) },
    setSort(v) { mutate(s => { s.ui.sort = v }) },
    setDone(v) { mutate(s => { s.ui.dn = v }) },
    importData(text) {
      let o; try { o = JSON.parse(text) } catch { toast('Invalid backup text'); return false }
      commit(normalize(o))
    },
    reset() {
      ask('w', 'Delete ALL data?', 'Everything in your account is erased and the planner starts fresh.', () => {
        const n = normalize(makeDefault()); n.demo = 'empty'; commit(n)
      }, true)
    },
    loadDemo(kind) {
      const go = () => {
        const n = kind === 'empty' ? normalize(makeDefault()) : normalize(demoData(kind, new Date()))
        n.demo = kind; commit(n); goDay(iso(new Date()))
      }
      if (!S.demo) { go(); return }
      ask('w', kind === 'empty' ? 'Clear everything and start empty?' : 'Replace all data with the demo?', 'All current data in your account will be replaced.', go, true)
    },
  }

  if (!S) return <div className="auth"><div className="c"><b>Loading your planner…</b></div></div>

  const value = { user, S, sel, V, setV, setM, goDay, mutate, A, ask, toast, edit, setEdit, cx, setCx, sync, T0 }
  return (
    <Ctx.Provider value={value}>
      {children}
      {dlg && <ConfirmDialog dlg={dlg} close={closeDlg} />}
      <div className={'toast' + (toastMsg ? ' on' : '')}>{toastMsg}</div>
      {conflict && (
        <div className="sw"><div className="swc"><div className="swi w">!</div><h3>Changed on another device</h3>
          <p>Newer data was saved from somewhere else. Load it, or overwrite it with what you have here.</p>
          <div className="fr" style={{ justifyContent: 'center' }}>
            <button className="pb" onClick={() => resolveConflict(false)}>Load latest</button>
            <button className="pb o" onClick={() => resolveConflict(true)}>Keep mine</button>
          </div></div></div>
      )}
    </Ctx.Provider>
  )
}

function ConfirmDialog({ dlg, close }) {
  const yes = () => { const f = dlg.fn; close(); f && f() }
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') { e.preventDefault(); close() } else if (e.key === 'Enter') { e.preventDefault(); yes() } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line
  }, [])
  return (
    <div className="sw" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="swc">
        <div className={'swi ' + dlg.ic}>{dlg.ic === 'q' ? '?' : '!'}</div>
        <h3>{dlg.title}</h3><p>{dlg.text}</p>
        <div className="fr" style={{ justifyContent: 'center' }}>
          <button autoFocus className={'pb' + (dlg.danger ? ' dg' : '')} onClick={yes}>Yes</button>
          <button className="pb o" onClick={close}>No</button>
        </div>
      </div>
    </div>
  )
}
