import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { AppProvider, useApp } from './store'
import Auth from './components/Auth'
import { ContextMenu } from './components/ui'
import { AddEventModal, EditModal, Welcome } from './components/modals'
import { AreaView, DayView, HalfView, MonthView, QuarterView, SetupView, WeekView, YearView } from './components/views'
import { ws } from './utils'

const TABS = [['d', 'Day'], ['w', 'Week'], ['m', 'Month'], ['q', 'Quarter'], ['h', '6 Months'], ['y', 'Year'], ['a', 'Area'], ['s', 'Setup']]
const VIEWS = { d: DayView, w: WeekView, m: MonthView, q: QuarterView, h: HalfView, y: YearView, a: AreaView, s: SetupView }
const SYNC = { load: ['Loading…', ''], ok: ['Synced', 'ok'], sv: ['Saving…', 'sv'], er: ['Offline - changes kept on this device', 'er'] }

function Shell() {
  const { S, V, setV, A, user, sync } = useApp()
  const View = VIEWS[V.tab]
  const demo = S.demo === 'student' || S.demo === 'pro'
  return (
    <main>
      <header className="hd">
        <div className="topbar">
          <h1><span>☑</span> Master Progress Dashboard</h1>
          <div className="usr"><span className={'sync ' + SYNC[sync][1]}>{SYNC[sync][0]}</span><span>{user.displayName || user.email}</span>
            <button className="pb o" onClick={() => signOut(auth)}>Sign out</button></div>
        </div>
        <p>Day, week, month, quarter, 6-month and year tracker. Your data syncs to your account.</p>
      </header>
      {demo && <div className="bn">Demo data: a sample {S.demo === 'pro' ? 'professional' : 'student'} plan built around today's date. <button className="lk" onClick={() => setV({ tab: 's' })}>Change or clear it in Setup</button></div>}
      <div className="tabs">{TABS.map(([k, n]) => <button key={k} className={V.tab === k ? 'on' : ''} onClick={() => setV({ tab: k, ...(k === 'w' ? { wk: ws(V.day) } : {}) })}>{n}</button>)}</div>
      <div className="sb">
        <span>Sort lists by</span>
        <select value={S.ui.sort} onChange={e => A.setSort(e.target.value)}>{[['time', 'Time'], ['name', 'Name'], ['area', 'Area'], ['prog', 'Progress (lowest first)']].map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        <label><input type="checkbox" checked={S.ui.dn} onChange={e => A.setDone(e.target.checked)} /> Completed to the bottom</label>
      </div>
      <View />
      <ContextMenu /><EditModal /><AddEventModal /><Welcome />
    </main>
  )
}
export default function App() {
  const [user, setUser] = useState(undefined)
  useEffect(() => onAuthStateChanged(auth, u => setUser(u || null)), [])
  if (user === undefined) return <div className="auth"><div className="c"><b>Loading…</b></div></div>
  if (!user) return <Auth />
  return <AppProvider key={user.uid} user={user}><Shell /></AppProvider>
}
