import { useState } from 'react'
import { useApp } from '../store'
import { Bar, Kpi, Stat, Cl, sub, useCm } from './ui'
import {
  AddTaskForm, AreaBars, AreaSelect, Blocks, CalCard, EvCard, EvForm, EvRow, ExCard, GoalForm, GoalList, GoalRow,
  PrayerCard, PrayerStats, TopRows, YmNav, YrNav, nextEventKpi,
} from './shared'
import { MN, P2, RK, RN, T0, fd, fdt, iso, pct, weeksOf, wdays, ws, ymRange, nextOf } from '../utils'

const mu = { margin: 0 }

/* ---------- per-area cards (Day / Week / Month / Year scopes) ---------- */
function AreaCards({ s }) {
  const { S, V, sel } = useApp()
  const wk = V.dw || ws(V.day)
  const scope = {
    d: { t: sel.TD(V.day), g: [['D', V.day, 'Day'], ['W', wk, 'Week'], ['M', V.ym, 'Month']], list: 1 },
    w: { t: wdays(V.wk).flatMap(sel.TD), g: [['W', V.wk, 'Week']], list: 1 },
    m: { t: sel.TM(V.ym), g: [['M', V.ym, 'Month']] },
    y: { t: ymRange(V.yr, 1, 12).flatMap(sel.TM), g: [['Y', '' + V.yr, 'Year']] },
  }[s]
  return S.ar.map(a => {
    const tk = scope.t.filter(t => t.a === a.id).sort(sel.cmp), [d, t] = sel.st(tk)
    const gs = sel.srtG(scope.g.flatMap(([l, p, lb]) => sel.G(l, p).filter(g => g.a === a.id).map(g => ({ ...g, lb }))))
    return (
      <div className="c w6" key={a.id}>
        <h2><b style={{ color: a.c }}>{a.n}</b><small>{pct(d, t)}% · {d}/{t} tasks</small></h2>
        <Bar p={pct(d, t)} c={a.c} />
        <Cl k={'a' + a.id + s}>
          <div className="ln">Tasks</div>
          {scope.list ? <Blocks list={tk} showDate={s === 'w'} /> : <p className="mu">Open Day or Week to see single tasks.</p>}
          <div className="ln">Targets</div>
          {gs.map(g => <GoalRow key={g.id + g.lb} g={g} lb={g.lb} />)}
          {!gs.length && <p className="mu">No targets for this area.</p>}
        </Cl>
      </div>
    )
  })
}

/* ---------- Day ---------- */
export function DayView() {
  const { V, setV, goDay, sel } = useApp()
  const l = sel.TM(V.ym), dl = sel.TD(V.day).sort(sel.cmp), [dd, dt] = sel.st(dl)
  const wk = V.dw || ws(V.day), wl = weeksOf(V.ym)
  const step = n => { const d = new Date(V.day + 'T00:00'); d.setDate(d.getDate() + n); goDay(iso(d)) }
  return (
    <div className="g">
      <TopRows list={l} ex /><div className="brk" />
      <div className="c w7">
        <h2>{fd(V.day, { weekday: 'short', day: 'numeric', month: 'short' })} <small>{dd}/{dt} tasks</small></h2>
        <Bar p={pct(dd, dt)} />
        <div className="nv" style={{ margin: '10px 0 0' }}>
          <button onClick={() => step(-1)}>Prev</button><button onClick={() => goDay(iso(T0))}>Today</button><button onClick={() => step(1)}>Next</button>
        </div>
        <Cl k="dt"><Blocks list={dl} /></Cl>
        <AddTaskForm />
      </div>
      <div className="col w5">
        <CalCard /><PrayerCard />
        <div className="c"><h2>Progress by area</h2><AreaBars list={l} /></div>
        <div className="two"><EvCard /><ExCard /></div>
      </div>
      <div className="c w7">
        <h2>Weekly tasks <small>{sel.ga(sel.G('W', wk))}%</small></h2>
        <div className="nv" style={{ marginBottom: 6 }}>
          {wl.map((w, i) => <button key={w} className={w === wk ? 'on' : ''} title={fd(w, { day: 'numeric', month: 'short' })} onClick={() => setV({ dw: w })}>W{i + 1}</button>)}
          <span className="mu">{fd(wk, { day: 'numeric', month: 'short' })} - {fd(wdays(wk)[6], { day: 'numeric', month: 'short' })}</span>
        </div>
        <Cl k="dw"><GoalList l="W" p={wk} /></Cl>
      </div>
      <div className="c w5"><h2>Monthly assigned tasks <small>{sel.ga(sel.G('M', V.ym))}%</small></h2><Cl k="dm"><GoalList l="M" p={V.ym} /></Cl></div>
      <AreaCards s="d" />
    </div>
  )
}

/* ---------- Week ---------- */
export function WeekView() {
  const { V, setV, sel } = useApp()
  const days = wdays(V.wk), all = days.flatMap(sel.TD), [d, t] = sel.st(all), gs = sel.G('W', V.wk), cd = nextEventKpi(sel)
  const shift = n => { const x = new Date(V.wk + 'T00:00'); x.setDate(x.getDate() + 7 * n); setV({ wk: iso(x) }) }
  const fmt = { day: 'numeric', month: 'short' }
  return (
    <>
      <div className="nv">
        <button onClick={() => shift(-1)}>Prev week</button><b>{fd(days[0], fmt)} - {fd(days[6], fmt)}</b>
        <button onClick={() => shift(1)}>Next week</button><button onClick={() => setV({ wk: ws(iso(T0)) })}>This week</button>
      </div>
      <div className="g">
        <Stat l="Week progress" p={pct(d, t)} c="var(--ac)" s={d + ' / ' + t + ' tasks'} />
        {sel.byA(all).map(([a, x, y]) => <Stat key={a.id} l={a.n} p={pct(x, y)} c={a.c} s={x + ' / ' + y + ' tasks'} />)}
        <Kpi l="Weekly targets" v={sel.ga(gs) + '%'} s={gs.length + ' targets'} c="var(--TD)" x="q" />
        <Kpi l="Next event" v={cd[1]} s={cd[0]} c="var(--EX)" x="q" />
        <div className="c w12"><h2>Days <small>click to open</small></h2>
          <div className="mg">{days.map(x => { const [a, b] = sel.st(sel.TD(x)); return (
            <button key={x} className="mc" onClick={() => { setV({ day: x, ym: x.slice(0, 7), dw: null, tab: 'd' }) }}>
              <b>{fd(x, { weekday: 'short', day: 'numeric' })}</b><Bar p={pct(a, b)} /><small>{a}/{b} tasks</small></button>) })}</div></div>
        <div className="c w6"><h2>Weekly targets and tasks <small>{sel.ga(gs)}%</small></h2><Cl k="ww"><GoalList l="W" p={V.wk} /></Cl><GoalForm l="W" p={V.wk} /></div>
        <div className="col w6"><div className="c"><h2>Events and deadlines <small>feeds Next event</small></h2>
          <Cl k="we">{sel.srtE(sel.upc()).map(x => <EvRow key={x.e.id} e={x.e} left={fdt(x.d)} />)}{!sel.upc().length && <p className="mu">No upcoming events.</p>}</Cl>
          <div className="ln">Add an event</div><EvForm /></div></div>
      </div>
    </>
  )
}

/* ---------- Month ---------- */
export function MonthView() {
  const { S, V, setV, setM, A, sel } = useApp()
  const l = sel.TM(V.ym), own = S.tk.some(x => x.d.startsWith(V.ym)), wl = weeksOf(V.ym), mi = +V.ym.slice(5) - 1
  const evs = sel.srtE(sel.evMonthList(V.ym))
  return (
    <>
      <YmNav />
      <div className="g">
        <TopRows list={l} /><div className="brk" />
        <CalCard cls="w5" />
        <div className="c w7"><h2>Weekly progress <small>{wl.length} weeks in {MN[mi]}</small></h2>
          <div className="mg">{wl.map((w, i) => {
            const dd = wdays(w).filter(x => x.startsWith(V.ym)), [a, b] = sel.st(dd.flatMap(sel.TD)), g = sel.G('W', w)
            return (<button key={w} className="mc" onClick={() => setV({ wk: w, tab: 'w' })}>
              <b>Week {i + 1} · {+dd[0].slice(8)}-{+dd[dd.length - 1].slice(8)} {MN[mi]}</b><Bar p={pct(a, b)} />
              <small>{a}/{b} tasks{g.length ? ' | targets ' + sel.ga(g) + '%' : ''}</small></button>)
          })}</div></div>
        <div className="c w12"><h2>Prayers <small>{MN[mi]} {V.ym.slice(0, 4)}</small></h2><PrayerStats yms={[V.ym]} /></div>
        <div className="c w7"><h2>Monthly targets <small>{sel.ga(sel.G('M', V.ym))}%</small></h2><Cl k="mt"><GoalList l="M" p={V.ym} /></Cl></div>
        <div className="c w5"><h2>Events in {MN[mi]} <small>{evs.length ? 'right-click to edit' : ''}</small></h2>
          <Cl k="me">{evs.map(x => <EvRow key={x.e.id + x.ds} e={x.e} left={+x.ds.slice(8) + ' ' + MN[mi]} />)}{!evs.length && <p className="mu">No events this month.</p>}</Cl></div>
        <div className="c w7"><h2>Add a monthly target</h2><GoalForm l="M" p={V.ym} /></div>
        <div className="c w5"><h2>Add an event</h2><EvForm /></div>
        <form className="c w12 fm" onSubmit={e => { e.preventDefault(); A.initMonth([...e.currentTarget.querySelectorAll('.wd:checked')].map(x => +x.value)) }}>
          <h2>Initialize {MN[mi]} {V.ym.slice(0, 4)} <small>{own ? 'template can be added again' : 'start here'}</small></h2>
          <p className="mu" style={{ margin: '0 0 8px' }}>Creates tasks for each selected weekday from your daily template (edit it in Setup). Default daily tasks appear automatically.</p>
          <div>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((n, i) => <label key={n}><input type="checkbox" className="wd" value={i} defaultChecked /> {n}</label>)}</div>
          <div className="fr"><button className="pb">Initialize month</button><span className="mu">{S.tpl.length} blocks per day</span></div>
        </form>
      </div>
    </>
  )
}

/* ---------- Quarter / 6 months ---------- */
function Period({ ttl, sub: subt, yms, l, per }) {
  const { V, setV, setM, sel } = useApp()
  const tl = yms.flatMap(sel.TM), [d, t] = sel.st(tl), gs = sel.G(l, per)
  return (
    <div className="c w6">
      <h2>{ttl} <small>{subt}</small></h2>
      <div className="ab"><b>Tasks</b><Bar p={pct(d, t)} /><span>{pct(d, t)}%</span></div>
      <div className="ab"><b>Targets</b><Bar p={sel.ga(gs)} c="var(--TD)" /><span>{sel.ga(gs)}%</span></div>
      <div className="ln">Prayers</div><PrayerStats yms={yms} cp />
      <div className="mg" style={{ marginTop: 10 }}>{yms.map(m => { const [a, b] = sel.st(sel.TM(m)), g = sel.G('M', m); return (
        <button key={m} className="mc" onClick={() => { setM(m); setV({ tab: 'm' }) }}><b>{MN[+m.slice(5) - 1]}</b><Bar p={pct(a, b)} />
          <small>{a}/{b} tasks{g.length ? ' | ' + sel.ga(g) + '%' : ''}</small></button>) })}</div>
      <div className="ln">Targets and actions</div>
      <Cl k={'p' + l + per}><GoalList l={l} p={per} /></Cl><GoalForm l={l} p={per} />
    </div>
  )
}
export function QuarterView() {
  const { V } = useApp()
  return (<><YrNav /><div className="g">{[1, 2, 3, 4].map(q => <Period key={q} ttl={'Q' + q} sub={MN[q * 3 - 3] + ' - ' + MN[q * 3 - 1]} yms={ymRange(V.yr, q * 3 - 2, q * 3)} l="Q" per={V.yr + '-Q' + q} />)}</div></>)
}
export function HalfView() {
  const { V } = useApp()
  return (<><YrNav /><div className="g">{[1, 2].map(h => <Period key={h} ttl={'H' + h} sub={h == 1 ? 'Jan - Jun' : 'Jul - Dec'} yms={ymRange(V.yr, h * 6 - 5, h * 6)} l="H" per={V.yr + '-H' + h} />)}</div></>)
}

/* ---------- Year ---------- */
export function YearView() {
  const { V, setV, setM, sel } = useApp()
  const months = ymRange(V.yr, 1, 12), all = months.flatMap(sel.TM), [d, t] = sel.st(all), gs = sel.G('Y', '' + V.yr), cd = nextEventKpi(sel)
  return (
    <>
      <YrNav />
      <div className="g">
        <Stat l={'Year ' + V.yr + ' tasks'} p={pct(d, t)} c="var(--ac)" s={d + ' / ' + t + ' tasks done'} />
        <Stat l="Targets" p={sel.ga(gs)} c="var(--TD)" s={gs.length + ' targets'} />
        <Kpi l="Months with tasks" v={months.filter(m => sel.TM(m).length).length + '/12'} s="in this year" c="var(--DL)" x="q" />
        <Kpi l="Next event" v={cd[1]} s={cd[0]} c="var(--EX)" x="q" />
        <div className="c w12"><h2>Quarters <small>overview</small></h2><div className="mg">{[1, 2, 3, 4].map(q => { const [a, b] = sel.st(ymRange(V.yr, q * 3 - 2, q * 3).flatMap(sel.TM)), g = sel.G('Q', V.yr + '-Q' + q); return (
          <button key={q} className="mc" onClick={() => setV({ tab: 'q' })}><b>Q{q}</b><Bar p={pct(a, b)} /><small>{a}/{b} tasks{g.length ? ' | ' + sel.ga(g) + '%' : ''}</small></button>) })}</div></div>
        <div className="c w12"><h2>Months <small>click to open</small></h2><div className="mg">{months.map(m => { const [a, b] = sel.st(sel.TM(m)), g = sel.G('M', m); return (
          <button key={m} className="mc" onClick={() => { setM(m); setV({ tab: 'm' }) }}><b>{MN[+m.slice(5) - 1]} {V.yr}</b><Bar p={pct(a, b)} /><small>{a}/{b} tasks{g.length ? ' | targets ' + sel.ga(g) + '%' : ''}</small></button>) })}</div></div>
        <div className="c w12"><h2>Yearly prayers <small>{V.yr}</small></h2><PrayerStats yms={months} /></div>
        <div className="c w12"><h2>Yearly tasks and targets <small>{sel.ga(gs)}%</small></h2><GoalList l="Y" p={'' + V.yr} /><GoalForm l="Y" p={'' + V.yr} /></div>
        <div className="c w12"><h2>Yearly progress by area</h2><AreaBars list={all} /></div>
      </div>
    </>
  )
}

/* ---------- Area ---------- */
export function AreaView() {
  const { V, setV } = useApp()
  const s = V.as
  const lbl = { d: fd(V.day, { weekday: 'short', day: 'numeric', month: 'short' }), w: 'week of ' + fd(V.wk, { day: 'numeric', month: 'short' }), m: MN[+V.ym.slice(5) - 1] + ' ' + V.ym.slice(0, 4), y: V.yr }[s]
  return (
    <>
      <div className="nv">
        {[['d', 'Day'], ['w', 'Week'], ['m', 'Month'], ['y', 'Year']].map(([k, n]) => <button key={k} className={k === s ? 'on' : ''} onClick={() => setV({ as: k })}>{n}</button>)}
        <span className="mu">{lbl}</span>
      </div>
      <div className="g"><AreaCards s={s} /></div>
    </>
  )
}

/* ---------- Setup ---------- */
export function SetupView() {
  const { S, sel, A, setEdit, V, setV } = useApp(), cm = useCm()
  const [bk, setBk] = useState('')
  const wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const rec = S.ev.filter(e => e.r && e.r !== 'o').sort((a, b) => (S.ui.sort === 'name' ? String(a.n).localeCompare(b.n) : RK[a.r] - RK[b.r]))
  return (
    <div className="g">
      <div className="c w12"><h2>Demo data <small>sample plans generated around today's date</small></h2>
        <div className="fr" style={{ margin: 0 }}>
          <button className="pb" onClick={() => A.loadDemo('student')}>Load student demo</button>
          <button className="pb" onClick={() => A.loadDemo('pro')}>Load professional demo</button>
          <button className="pb o" onClick={() => A.loadDemo('empty')}>Clear everything and start empty</button>
        </div>
        <p className="mu" style={{ margin: '8px 0 0', fontSize: 12 }}>Loading a demo replaces all current data. Use Backup below to save your own first.</p></div>

      <div className="c w12">
        <h2>Default daily tasks <small>added to every day in their date range, tracked in all stats</small></h2>
        {sel.srtT(S.df).map(f => (
          <div className="ml" key={f.id} {...cm('df|' + f.id)}>
            <span>{f.s}-{f.e}</span><b style={{ color: sel.AR(f.a).c }}>{sel.AR(f.a).n}</b><span>{f.t}</span>
            <small>{f.f} to {f.u} | {f.w.length == 7 ? 'every day' : f.w.map(i => 'SMTWTFS'[i]).join(' ')}</small>
            <button className="dl" title="Edit" onClick={() => setEdit('df|' + f.id)}>✎</button>
            <button className="dl" title="End after today" onClick={() => A.stopDefault(f.id)}>stop</button>
            <button className="dl" onClick={() => A.remove('df|' + f.id)}>x</button>
          </div>
        ))}
        {!S.df.length && <p className="mu">No default tasks yet.</p>}
        <form className="fm" onSubmit={sub((f, form) => A.addDefault(f, [...form.querySelectorAll('.dw:checked')].map(x => +x.value)))}>
          <div className="fr"><input type="time" name="s" defaultValue="06:30" /><input type="time" name="e" defaultValue="07:00" /><AreaSelect /><input name="t" placeholder="Default task" style={{ flex: 1, minWidth: 140 }} /></div>
          <div className="fr"><span className="mu">From</span><input type="date" name="f" defaultValue={iso(T0)} /><span className="mu">to</span><input type="date" name="x" defaultValue={T0.getFullYear() + '-12-31'} />
            {wk.map((n, i) => <label key={n}><input type="checkbox" className="dw" value={i} defaultChecked /> {n}</label>)}<button className="pb">Add default task</button></div>
        </form>
      </div>

      <div className="c w6">
        <h2>Areas <small>tracks and colors</small></h2>
        {S.ar.map(a => <div className="ml" key={a.id}><b style={{ color: a.c }}>● {a.n}</b><button className="dl" style={{ marginLeft: 'auto' }} onClick={() => A.removeArea(a.id)}>x</button></div>)}
        <form className="fm" onSubmit={sub(f => A.addArea(f))}><div className="fr"><input name="n" placeholder="New area" style={{ flex: 1 }} /><input type="color" name="c" defaultValue="#06b6d4" /><button className="pb">Add</button></div></form>
      </div>

      <div className="c w6">
        <h2>Daily template <small>used by Initialize month</small></h2>
        {S.tpl.map((p, i) => <div className="ml" key={i}><span>{p.s}-{p.e}</span><b style={{ color: sel.AR(p.a).c }}>{sel.AR(p.a).n}</b><span>{p.t}</span><button className="dl" style={{ marginLeft: 'auto' }} onClick={() => A.removeTpl(i)}>x</button></div>)}
        <form className="fm" onSubmit={sub(f => A.addTpl(f))}><div className="fr"><input type="time" name="s" defaultValue="07:00" /><input type="time" name="e" defaultValue="10:00" /><AreaSelect /><input name="t" placeholder="Task" style={{ flex: 1, minWidth: 120 }} /><button className="pb">Add</button></div></form>
      </div>

      <div className="c w12">
        <h2>Default events <small>weekly, monthly or yearly; they show automatically on each upcoming date</small></h2>
        {rec.map(e => <EvRow key={e.id} e={e} left={RN[e.r]} />)}
        {!rec.length && <p className="mu">No recurring events yet.</p>}
        <EvForm r="w" />
      </div>

      <div className="c w12">
        <h2>Backup and reuse <small>move data between devices</small></h2>
        <textarea rows={4} style={{ width: '100%' }} value={bk} onChange={e => setBk(e.target.value)} placeholder="Export shows your data here. Paste a backup here and press Import." />
        <div className="fr">
          <button className="pb" onClick={() => setBk(JSON.stringify(S))}>Export</button>
          <button className="pb o" onClick={() => A.importData(bk)}>Import</button>
          <button className="pb o" onClick={() => A.reset()}>Reset everything</button>
        </div>
      </div>
    </div>
  )
}
