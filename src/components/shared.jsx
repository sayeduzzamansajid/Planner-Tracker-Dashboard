import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { Bar, Kpi, Stat, Cl, useCm, sub } from './ui'
import { MN, P2, PC, PN, PRG, RN, T0, cdn, curP, evOn, fd, fdt, hmNow, hmm, iso, pct, ptimes, todayISO, xKind, daysIn } from '../utils'

export const AreaOpts = ({ areas }) => areas.map(a => <option key={a.id} value={a.id}>{a.n}</option>)
export const AreaSelect = ({ name = 'a', value }) => {
  const { S } = useApp()
  return <select name={name} defaultValue={value}><AreaOpts areas={S.ar} /></select>
}

/* ---------------- tasks ---------------- */
export function Blocks({ list, showDate }) {
  const { S, sel, A, setCx } = useApp()
  const cm = useCm()
  if (!list.length) return <p className="mu">No tasks here.</p>
  const today = todayISO()
  return sel.srtT(list).map(x => {
    const a = sel.AR(x.a), key = x.df ? 'df|' + x.id.split('|')[0] : 't|' + x.id
    const star = !!S.im[x.id]
    const label = x.d < today ? 'Today' : x.d > today ? 'Next day' : 'Tomorrow'
    const now = x.d === today && hmNow() >= x.s && hmNow() < x.e
    const stop = fn => e => { e.stopPropagation(); fn(e) }
    return (
      <div key={x.id} className={`blk ${x.x ? 'dn' : ''} ${now ? 'now' : ''} ${star ? 'im' : ''}`} onClick={() => A.toggleTask(x.id)} {...cm(key)}>
        <div className="tm">{x.s}<small>{showDate ? fd(x.d, { day: 'numeric', month: 'short' }) : x.e}</small></div>
        <div className="t">
          <span className="ar" style={{ color: a.c }}>{a.n}{x.df ? ' (daily default)' : ''}{x.mf && <i className="mvl"> · moved from {fd(x.mf, { day: 'numeric', month: 'short' })}</i>}</span>
          {x.t}
        </div>
        <button className={'stb' + (star ? ' on' : '')} title={star ? 'Remove important mark' : 'Mark as important'} onClick={stop(() => A.toggleImportant(x.id))}>{star ? '★' : '☆'}</button>
        <button className="mvb" disabled={!!(x.x || x.df)} title={x.df ? 'Daily default tasks repeat every day' : x.x ? 'Completed tasks cannot be moved' : 'Move'} onClick={stop(() => A.moveTask(x.id))}>{label} →</button>
        <button className="dl" title="Edit or delete" onClick={stop(e => { const r = e.currentTarget.getBoundingClientRect(); setCx({ key, x: r.left, y: r.bottom }) })}>⋮</button>
        <div className="ck">{x.x ? '✓' : ''}</div>
      </div>
    )
  })
}

export function AddTaskForm() {
  const { A } = useApp()
  return (
    <form className="fm" onSubmit={sub(f => A.addTask(f))}>
      <div className="ln">Add an extra task to this day</div>
      <div className="fr"><input type="time" name="s" defaultValue="20:00" /><input type="time" name="e" /><AreaSelect />
        <label style={{ margin: 0 }}><input type="checkbox" name="im" /> ★ Important</label></div>
      <div className="fr"><input name="t" placeholder="Task: extra work, exam prep..." style={{ flex: 1, minWidth: 140 }} /><button className="pb">Add task</button></div>
    </form>
  )
}

/* ---------------- goals ---------------- */
export function GoalRow({ g, lb }) {
  const { sel, A, setEdit } = useApp()
  const cm = useCm(), a = sel.AR(g.a), done = sel.gp(g) >= 100
  return (
    <div className={'gr ' + (done ? 'dn' : '')} {...cm('g|' + g.id)}>
      <div className="gl" onClick={() => A.toggleGoal(g.id)}>
        <div className="ck">{done ? '✓' : ''}</div>
        <div className="gt"><b>{g.t}</b> <small style={{ color: a.c }}>{a.n}{lb ? ' · ' + lb : ''}</small><Bar p={sel.gp(g)} c={a.c} /></div>
      </div>
      <input type="number" key={g.cu} defaultValue={g.cu} onBlur={e => +e.target.value !== g.cu && A.setGoalCurrent(g.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />
      <small>/ {g.tg} {g.u || ''}</small>
      <button className="dl" title="Edit" onClick={() => setEdit('g|' + g.id)}>✎</button>
      <button className="dl" title="Delete" onClick={() => A.remove('g|' + g.id)}>x</button>
    </div>
  )
}
export function GoalList({ l, p }) {
  const { sel } = useApp()
  const g = sel.srtG(sel.G(l, p))
  return g.length ? g.map(x => <GoalRow key={x.id} g={x} />) : <p className="mu">No targets yet. Click a target to mark it complete, right-click to edit or delete.</p>
}
export function GoalForm({ l, p }) {
  const { A } = useApp()
  return (
    <form className="fm" onSubmit={sub(f => A.addGoal(l, p, f))}>
      <div className="fr"><input name="t" placeholder="Target or task" style={{ flex: 1, minWidth: 130 }} /><input name="g" type="number" defaultValue="1" style={{ width: 64 }} title="Target number" />
        <input name="u" placeholder="unit" style={{ width: 70 }} /><AreaSelect /><button className="pb">Add</button></div>
    </form>
  )
}

/* ---------------- events ---------------- */
const KINDS = [['e', 'Event'], ['x', 'Exam'], ['a', 'Assignment']]
export function EvForm({ r, kd }) {
  const { A } = useApp()
  return (
    <form className="fm" onSubmit={sub(f => A.addEvent(f))}>
      <div className="fr"><input name="t" placeholder="Event name" style={{ flex: 1, minWidth: 130 }} /><input type="date" name="d" /><input type="time" name="h" defaultValue="09:30" />
        <select name="k" defaultValue={kd || 'e'}>{KINDS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
        <select name="r" defaultValue={r || 'o'}>{Object.keys(RN).map(k => <option key={k} value={k}>{RN[k]}</option>)}</select>
        <button className="pb">Add event</button></div>
    </form>
  )
}
export function EvRow({ e, left }) {
  const { setEdit, A } = useApp(), cm = useCm()
  return (
    <div className="ml" {...cm('e|' + e.id)}>
      <b>{left}</b><span>{e.n}</span>
      {e.k && e.k !== 'e' && <span className="tg" style={{ color: 'var(--EX)' }}>{e.k === 'x' ? 'Exam' : 'Assignment'}</span>}
      <span className="tg">{RN[e.r || 'o']}</span><small>{e.t.slice(11, 16)}</small>
      <button className="dl" onClick={() => setEdit('e|' + e.id)}>✎</button>
      <button className="dl" onClick={() => A.remove('e|' + e.id)}>x</button>
    </div>
  )
}
export function EvCard() {
  const { sel, V, setV } = useApp(), cm = useCm()
  const u = sel.upcE(), n = V.more ? 3 : 1
  return (
    <div className="c">
      <h2><span>{n > 1 ? 'Next events' : 'Next event'}</span>
        <span className="hl">{u.length > 1 && <button className="lk" onClick={() => setV({ more: !V.more })}>{V.more ? 'Show less' : 'Show more'}</button>}
          <button className="lk pl" title="Add event" onClick={() => setV({ fl: true, fk: 'e' })}>+</button></span></h2>
      {u.slice(0, n).map(x => (
        <div className="ml" key={x.e.id} {...cm('e|' + x.e.id)}><span>{x.e.n}</span><span className="tg">{RN[x.e.r || 'o']}</span><small>{fdt(x.d)}</small></div>
      ))}
      {!u.length && <p className="mu">No upcoming events. Add one in Month, Week or Setup.</p>}
    </div>
  )
}
export function ExCard() {
  const { sel, V, setV, setEdit } = useApp(), cm = useCm()
  const u = sel.xl(), n = V.mx ? 3 : 1
  return (
    <div className="c">
      <h2><span>Exam / Due</span>
        <span className="hl">{u.length > 1 && <button className="lk" onClick={() => setV({ mx: !V.mx })}>{V.mx ? 'Show less' : 'Show more'}</button>}
          <button className="lk pl" title="Add exam or assignment" onClick={() => setV({ fl: true, fk: 'x' })}>+</button></span></h2>
      {u.slice(0, n).map(x => (
        <div className="ml" key={x.e.id} style={{ cursor: 'pointer' }} title="Change date or delete" onClick={() => setEdit('e|' + x.e.id)} {...cm('e|' + x.e.id)}>
          <span>{x.e.n}</span><span className="tg" style={{ color: xKind(x.e)[1] }}>{xKind(x.e)[0]}</span><small>{fdt(x.d)}</small>
        </div>
      ))}
      {!u.length && <p className="mu">None upcoming. Use + to add one.</p>}
    </div>
  )
}

/* ---------------- calendar ---------------- */
export function CalCard({ cls }) {
  const { S, sel, V, setV, goDay, setM } = useApp()
  const nd = daysIn(V.ym)
  const shift = n => { const d = new Date(+V.ym.slice(0, 4), +V.ym.slice(5) - 1 + n, 1); setM(d.getFullYear() + '-' + P2(d.getMonth() + 1)) }
  return (
    <div className={'c ' + (cls || '')}>
      <h2><span>Calendar · {MN[+V.ym.slice(5) - 1]} {V.ym.slice(0, 4)}</span>
        <span><button className="dl" onClick={() => shift(-1)}>‹</button><button className="dl" onClick={() => shift(1)}>›</button></span></h2>
      <div className="cal9">
        {Array.from({ length: nd }, (_, i) => {
          const dy = V.ym + '-' + P2(i + 1), [a, b] = sel.st(sel.TD(dy))
          return (
            <button key={dy} className={`dc ${dy === iso(T0) ? 'td' : ''} ${dy === V.day ? 'sel' : ''}`} onClick={() => { goDay(dy); setV({ tab: 'd' }) }}>
              {i + 1}{S.ev.some(e => evOn(e, dy)) && <u />}<i style={{ width: pct(a, b) + '%' }} />
            </button>
          )
        })}
      </div>
      <p className="mu" style={{ margin: '8px 0 0', fontSize: 12 }}>Bar = day progress. Dot = event.</p>
    </div>
  )
}
export const AreaBars = ({ list }) => {
  const { sel } = useApp()
  return sel.byA(list).map(([a, x, y]) => <div className="ab" key={a.id}><b style={{ color: a.c }}>{a.n}</b><Bar p={pct(x, y)} c={a.c} /><span>{pct(x, y)}%</span></div>)
}

/* ---------------- clock ---------------- */
const clk = () => {
  const n = new Date(), p = x => String(x).padStart(2, '0')
  return [p(n.getHours()) + ':' + p(n.getMinutes()), p(n.getSeconds()), n.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })]
}
export function ClockCard() {
  const [t, setT] = useState(clk)
  useEffect(() => { const i = setInterval(() => setT(clk()), 1000); return () => clearInterval(i) }, [])
  return <div className="c k q"><span>Time now</span><b style={{ color: '#10b981' }}><i style={{ fontStyle: 'normal' }}>{t[0]}</i><i className="cls">:{t[1]}</i></b><small>{t[2]}</small></div>
}

/* ---------------- top stat row ---------------- */
export function TopRows({ list, ex }) {
  const { V, sel } = useApp()
  const nd = daysIn(V.ym), isC = V.ym === iso(T0).slice(0, 7)
  const [d, t] = sel.st(list), [a, b] = sel.st(sel.TD(V.day))
  const n = (ex ? sel.upcE() : sel.upc())[0]
  let cd = ['No event', 'add one']
  if (n) cd = [n.e.n, cdn(n.d)]
  let xc = ['add an exam', 'None upcoming']
  const xe = sel.xl()[0]
  if (xe) xc = [(xe.e.k === 'x' ? 'Exam: ' : 'Due: ') + xe.e.n, cdn(xe.d)]
  return (
    <>
      <Stat l="Overall" p={pct(d, t)} c="var(--ac)" s={d + ' / ' + t + ' tasks done'} />
      {sel.byA(list).map(([x, p, q]) => <Stat key={x.id} l={x.n} p={pct(p, q)} c={x.c} s={p + ' / ' + q + ' tasks'} />)}
      <Kpi l={V.day === iso(T0) ? 'Today' : 'Selected day'} v={pct(a, b) + '%'} s={a + ' of ' + b + ' tasks done'} c="var(--TD)" x={ex ? 'q' : ''} />
      <Kpi l="Days left" v={isC ? nd - T0.getDate() : '-'} s={isC ? 'until month end' : 'not the current month'} c="var(--DL)" x={ex ? 'q' : ''} />
      {ex && <Kpi l="Next exam / due" v={xc[1]} s={xc[0]} c="#f59e0b" x="q" />}
      <Kpi l="Next event" v={cd[1]} s={cd[0]} c="var(--EX)" x={ex ? 'q' : 'x'} />
      {ex && <ClockCard />}
    </>
  )
}
export const nextEventKpi = sel => { const n = sel.upc()[0]; return n ? [n.e.n, cdn(n.d)] : ['No event', 'add one'] }

/* ---------------- prayers ---------------- */
export function PrayerCard() {
  const { S, V, A } = useApp()
  const t = ptimes(V.day, S.pr), b = S.pr.d[V.day] || 0, c = V.day === iso(T0) ? curP(t) : -1
  const rg = [[t[0], t[1]], [t[2], t[3]], [t[3], t[4]], [t[4], t[5]], [t[5], t[0]]]
  const n = [0, 1, 2, 3, 4].filter(k => (b >> k) & 1).length
  return (
    <div className="c">
      <h2>Prayers <small>{n}/5 · sunrise {hmm(t[1])}</small></h2>
      <div className="fr" style={{ margin: '0 0 6px' }}>
        <select value={S.pr.reg} onChange={e => A.setPrayerRegion(e.target.value)}>{PRG.map(r => <option key={r[0]} value={r[0]}>{r[0]} ({r[1]})</option>)}</select>
        <select value={S.pr.asr === 'shafi' ? 'shafi' : 'hanafi'} onChange={e => A.setPrayerAsr(e.target.value)}><option value="hanafi">Asr: Hanafi</option><option value="shafi">Asr: Shafi</option></select>
      </div>
      {PN.map((nm, k) => (
        <div key={nm} className={`blk pr ${(b >> k) & 1 ? 'dn' : ''} ${c === k ? 'now' : ''}`} onClick={() => A.togglePrayer(k)}>
          <div className="t"><span className="ar" style={{ color: PC[k], fontSize: 14 }}>{nm}{c === k ? ' · now' : ''}</span><span className="mu">{hmm(rg[k][0])} - {hmm(rg[k][1])}</span></div>
          <div className="ck">{(b >> k) & 1 ? '✓' : ''}</div>
        </div>
      ))}
    </div>
  )
}
export function PrayerStats({ yms, cp }) {
  const { sel } = useApp(), s = sel.prStat(yms)
  return (
    <div className={'pst ' + (cp ? 'cp' : '')}>
      <div className="ptot"><b>{s.tot}</b><span> / {s.pos}</span><small>{pct(s.tot, s.pos)}% · {s.days} days</small><Bar p={pct(s.tot, s.pos)} c="#10b981" /></div>
      <div>{PN.map((n, k) => <div className="ab" key={n}><b style={{ color: PC[k] }}>{n}</b><Bar p={pct(s.c[k], s.days)} c={PC[k]} /><span style={{ width: 58 }}>{s.c[k]}/{s.days}</span></div>)}</div>
    </div>
  )
}
export const YmNav = () => {
  const { V, setM } = useApp()
  const shift = n => { const d = new Date(+V.ym.slice(0, 4), +V.ym.slice(5) - 1 + n, 1); setM(d.getFullYear() + '-' + P2(d.getMonth() + 1)) }
  return <div className="nv"><button onClick={() => shift(-1)}>Prev</button><b>{MN[+V.ym.slice(5) - 1]} {V.ym.slice(0, 4)}</b><button onClick={() => shift(1)}>Next</button></div>
}
export const YrNav = () => {
  const { V, setV } = useApp()
  return <div className="nv"><button onClick={() => setV({ yr: V.yr - 1 })}>&lt;</button><b>{V.yr}</b><button onClick={() => setV({ yr: V.yr + 1 })}>&gt;</button></div>
}
export { Cl }
