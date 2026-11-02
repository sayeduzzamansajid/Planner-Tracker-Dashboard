import { PTD, CUM } from './prayerData'

export const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const P2 = n => String(n).padStart(2, '0')
export const uid = () => Math.random().toString(36).slice(2, 8)
export const pct = (n, t) => (t ? Math.round((100 * n) / t) : 0)
export const iso = d => d.getFullYear() + '-' + P2(d.getMonth() + 1) + '-' + P2(d.getDate())
export const T0 = new Date()
export const todayISO = () => iso(new Date())

export const ws = d => { const t = new Date(d + 'T00:00'); t.setDate(t.getDate() - t.getDay()); return iso(t) }
export const fd = (d, o) => new Date(d + 'T00:00').toLocaleDateString('en-GB', o)
export const fdt = d => d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const hmNow = () => new Date().toTimeString().slice(0, 5)
export const nextOf = d => { const t = new Date(d + 'T00:00'); t.setDate(t.getDate() + 1); return iso(t) }
export const daysIn = ym => new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate()

export const RN = { o: 'Once', w: 'Weekly', m: 'Monthly', y: 'Yearly' }
export const RK = { y: 0, m: 1, w: 2, o: 3 }

export const weeksOf = m => {
  const last = m + '-' + P2(daysIn(m)), o = []
  let w = ws(m + '-01')
  while (w <= last) { o.push(w); const t = new Date(w + 'T00:00'); t.setDate(t.getDate() + 7); w = iso(t) }
  return o
}
export const wdays = w => Array.from({ length: 7 }, (_, i) => { const t = new Date(w + 'T00:00'); t.setDate(t.getDate() + i); return iso(t) })
export const ymRange = (yr, a, b) => Array.from({ length: b - a + 1 }, (_, i) => yr + '-' + P2(a + i))

/* ---- events ---- */
export const evOn = (e, ds) => {
  const b = e.t.slice(0, 10)
  if (ds < b) return false
  if (!e.r || e.r === 'o') return ds === b
  if (e.r === 'w') return Math.round((new Date(ds) - new Date(b)) / 864e5) % 7 === 0
  if (e.r === 'm') return ds.slice(8) === b.slice(8)
  return ds.slice(5) === b.slice(5)
}
export const occ = (e, from) => {
  let d = new Date(e.t)
  if (!e.r || e.r === 'o') return d >= from ? d : null
  for (let i = 0; i < 900 && d < from; i++) {
    if (e.r === 'w') d.setDate(d.getDate() + 7)
    else if (e.r === 'm') d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
  }
  return d >= from ? d : null
}
export const cdn = d => { const h = Math.floor((d - new Date()) / 36e5); return Math.floor(h / 24) + 'd ' + (h % 24) + 'h' }
export const xKind = e => (e.k === 'x' ? ['Exam', 'var(--EX)'] : ['Assignment', '#f59e0b'])

/* ---- prayers ---- */
export const PRG = [['Sylhet','Far East',-8,-8],['Chattogram','Southeast',-6,-5],['Dhaka','Center',0,0],['Barishal','South',1,1],['Khulna','Southwest',3,4],['Rangpur','Northwest',4,4],['Rajshahi','Far West',7,7]]
export const PN = ['Fajr','Dhuhr','Asr','Maghrib','Isha']
export const PC = ['#60a5fa','#fbbf24','#fb923c','#f87171','#a78bfa']
export const hmm = m => P2(Math.floor(m / 60) % 24) + ':' + P2(m % 60)

export function ptimes(ds, pr) {
  const [, m, d] = ds.split('-').map(Number)
  const i = CUM[m - 1] + d - 1 - (m == 2 && d == 29 ? 1 : 0)
  const r = PRG.find(x => x[0] === pr.reg) || PRG[2]
  return [PTD[0][i], PTD[1][i], PTD[2][i], PTD[pr.asr === 'shafi' ? 3 : 6][i], PTD[4][i], PTD[5][i]].map((x, k) => x + (k === 0 ? r[2] : r[3]))
}
export const curP = t => {
  const n = new Date(), m = n.getHours() * 60 + n.getMinutes()
  return m >= t[5] || m < t[0] ? 4 : m < t[1] ? 0 : m < t[2] ? -1 : m < t[3] ? 1 : m < t[4] ? 2 : 3
}

/* ---- default state ---- */
const mk = (id, s, e, t) => ({ id, s, e, a: 'a4', t, f: iso(T0), u: T0.getFullYear() + '-12-31', w: [0,1,2,3,4,5,6] })
export const makeDefault = () => ({
  ar: [{ id: 'a1', n: 'Work', c: '#3b82f6' }, { id: 'a2', n: 'Study', c: '#10b981' }, { id: 'a3', n: 'Health', c: '#f59e0b' }, { id: 'a4', n: 'Personal', c: '#a78bfa' }],
  tpl: [{ s: '09:00', e: '12:00', a: 'a1', t: 'Deep work' }, { s: '14:00', e: '16:00', a: 'a2', t: 'Study or learning' }, { s: '18:00', e: '19:00', a: 'a3', t: 'Exercise' }],
  tk: [], gl: [], ev: [], dx: {}, im: {},
  pr: { reg: 'Dhaka', asr: 'hanafi', d: {} },
  ui: { sort: 'time', dn: true },
  df: [mk('d1', '06:30', '07:00', 'Wake up, water, no phone for 30 min'), mk('d2', '20:30', '21:00', 'Review the day and plan tomorrow'), mk('d3', '21:30', '22:00', 'Phone away, read 20 pages, sleep')],
})
/** Merge saved data over defaults and make sure nested objects exist. */
export const normalize = raw => {
  const S = Object.assign(makeDefault(), raw || {})
  S.ui = Object.assign({ sort: 'time', dn: true }, S.ui)
  S.pr = Object.assign({ reg: 'Dhaka', asr: 'hanafi', d: {} }, S.pr)
  return S
}
