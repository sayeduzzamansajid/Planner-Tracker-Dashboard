import { useEffect } from 'react'
import { useApp } from '../store'
import { Overlay, sub } from './ui'
import { AreaSelect, EvForm } from './shared'
import { RN } from '../utils'

const KINDS = [['e', 'Event'], ['x', 'Exam'], ['a', 'Assignment']]

export function EditModal() {
  const { S, edit, setEdit, A } = useApp()
  useEffect(() => {
    if (!edit) return
    const h = e => e.key === 'Escape' && setEdit(null)
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [edit, setEdit])
  if (!edit) return null
  const [t, id] = edit.split('|')
  const o = t === 't' ? S.tk.find(x => x.id === id) : t === 'g' ? S.gl.find(x => x.id === id) : t === 'e' ? S.ev.find(x => x.id === id) : S.df.find(x => x.id === id)
  if (!o) return null
  const ttl = { t: 'Edit task', g: 'Edit target', e: 'Edit event', df: 'Edit default task (all its days)' }[t]
  return (
    <Overlay onClose={() => setEdit(null)} z={40}>
      <form className="c md fm" onSubmit={sub(f => A.saveEdit(edit, f), true)}>
        <h2>{ttl}</h2>
        {t === 't' && <>
          <div className="fr"><input type="time" name="s" defaultValue={o.s} /><input type="time" name="e" defaultValue={o.e} /><AreaSelect value={o.a} /></div>
          <div className="fr"><input name="t" defaultValue={o.t} style={{ flex: 1 }} /></div>
          <div className="fr"><label style={{ margin: 0 }}><input type="checkbox" name="im" defaultChecked={!!S.im[id]} /> ★ Important</label></div></>}
        {t === 'g' && <>
          <div className="fr"><input name="t" defaultValue={o.t} style={{ flex: 1 }} /></div>
          <div className="fr"><span className="mu">Current</span><input type="number" name="c" defaultValue={o.cu} style={{ width: 70 }} /><span className="mu">of</span>
            <input type="number" name="g" defaultValue={o.tg} style={{ width: 70 }} /><input name="u" defaultValue={o.u || ''} placeholder="unit" style={{ width: 80 }} /><AreaSelect value={o.a} /></div></>}
        {t === 'e' && <>
          <div className="fr"><input name="t" defaultValue={o.n} style={{ flex: 1 }} /></div>
          <div className="fr"><input type="date" name="d" defaultValue={o.t.slice(0, 10)} /><input type="time" name="h" defaultValue={o.t.slice(11, 16)} />
            <select name="r" defaultValue={o.r || 'o'}>{Object.keys(RN).map(k => <option key={k} value={k}>{RN[k]}</option>)}</select>
            <select name="k" defaultValue={o.k || 'e'}>{KINDS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div></>}
        {t === 'df' && <>
          <div className="fr"><input type="time" name="s" defaultValue={o.s} /><input type="time" name="e" defaultValue={o.e} /><AreaSelect value={o.a} /></div>
          <div className="fr"><input name="t" defaultValue={o.t} style={{ flex: 1 }} /></div>
          <div className="fr"><span className="mu">From</span><input type="date" name="f" defaultValue={o.f} /><span className="mu">to</span><input type="date" name="x" defaultValue={o.u} /></div></>}
        <div className="fr">
          <button className="pb">Save</button>
          <button type="button" className="pb o" onClick={() => setEdit(null)}>Cancel</button>
          {t === 'e' && <button type="button" className="pb o" style={{ marginLeft: 'auto', color: 'var(--EX)' }} onClick={() => A.remove(edit)}>Delete</button>}
        </div>
      </form>
    </Overlay>
  )
}

export function AddEventModal() {
  const { V, setV } = useApp()
  useEffect(() => {
    if (!V.fl) return
    const h = e => e.key === 'Escape' && setV({ fl: false })
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [V.fl, setV])
  if (!V.fl) return null
  return (
    <Overlay onClose={() => setV({ fl: false })}>
      <div className="c md fm">
        <h2>Add event, exam or assignment <button className="lk" onClick={() => setV({ fl: false })}>Close</button></h2>
        <EvForm kd={V.fk || 'e'} />
      </div>
    </Overlay>
  )
}

export function Welcome() {
  const { S, A } = useApp()
  if (S.demo) return null
  return (
    <Overlay onClose={() => {}} z={50}>
      <div className="c md wl">
        <h2>Welcome to the planner</h2>
        <p className="mu" style={{ margin: 0 }}>Try it with sample data built around today's date, or start with a blank planner. Your data is saved to your account and syncs across devices.</p>
        <button className="opt" onClick={() => A.loadDemo('student')}><b>Student demo</b><span>Classes, study blocks, assignments, exams and weekly targets</span></button>
        <button className="opt" onClick={() => A.loadDemo('pro')}><b>Professional demo</b><span>Deep work, meetings, learning goals, deadlines and team events</span></button>
        <button className="opt" onClick={() => A.loadDemo('empty')}><b>Start empty</b><span>A blank planner with a small starter template</span></button>
      </div>
    </Overlay>
  )
}
