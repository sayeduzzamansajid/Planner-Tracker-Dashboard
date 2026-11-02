import { P2, pct, ws, iso, T0, evOn, occ, RK, wdays } from './utils'

/** Derived data for a given state S. Port of the original TD/TM/st/byA/G/gp/ga/sorting helpers. */
export function makeSel(S) {
  const TKM = {}
  S.tk.forEach(x => (TKM[x.d] = TKM[x.d] || []).push(x))

  const AR = id => S.ar.find(a => a.id === id) || { n: '(deleted)', c: '#888' }
  const aix = id => S.ar.findIndex(a => a.id === id)
  const nm = (a, b) => String(a).localeCompare(String(b))
  const cmp = (a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.s < b.s ? -1 : a.s > b.s ? 1 : 0)

  const DF = d =>
    S.df
      .filter(f => d >= f.f && d <= f.u && f.w.includes(new Date(d + 'T00:00').getDay()))
      .map(f => ({ id: f.id + '|' + d, d, s: f.s, e: f.e, a: f.a, t: f.t, x: !!S.dx[f.id + '|' + d], df: 1 }))
  const TD = d => (TKM[d] || []).concat(DF(d))
  const TM = m => {
    const [y, o] = m.split('-').map(Number)
    return Array.from({ length: new Date(y, o, 0).getDate() }, (_, i) => TD(m + '-' + P2(i + 1))).flat()
  }
  const st = l => [l.filter(t => t.x).length, l.length]
  const byA = l => S.ar.map(a => [a, ...st(l.filter(t => t.a === a.id))])
  const G = (l, p) => S.gl.filter(g => g.l === l && g.p === p)
  const gp = g => (g.tg ? Math.min(100, Math.round((100 * g.cu) / g.tg)) : 0)
  const ga = l => (l.length ? Math.round(l.reduce((s, g) => s + gp(g), 0) / l.length) : 0)
  const gdn = g => gp(g) >= 100

  const srtT = l => {
    const u = S.ui
    return l.slice().sort((a, b) =>
      (u.dn ? !!a.x - !!b.x : 0) || ((S.im[a.id] ? 0 : 1) - (S.im[b.id] ? 0 : 1)) || ((a.mf ? 0 : 1) - (b.mf ? 0 : 1)) ||
      (u.sort === 'name' ? nm(a.t, b.t) : u.sort === 'area' ? aix(a.a) - aix(b.a) : 0) || cmp(a, b))
  }
  const srtG = l => {
    const u = S.ui
    return l.slice().sort((a, b) =>
      (u.dn ? gdn(a) - gdn(b) : 0) ||
      (u.sort === 'name' ? nm(a.t, b.t) : u.sort === 'area' ? aix(a.a) - aix(b.a) : u.sort === 'prog' ? gp(a) - gp(b) : 0))
  }
  const srtE = l => (S.ui.sort === 'name' ? l.slice().sort((a, b) => nm(a.e.n, b.e.n)) : l)

  const upc = () => { const n = new Date(); return S.ev.map(e => ({ e, d: occ(e, n) })).filter(x => x.d).sort((a, b) => a.d - b.d || RK[a.e.r || 'o'] - RK[b.e.r || 'o']) }
  const upcE = () => upc().filter(x => x.e.k !== 'x' && x.e.k !== 'a')
  const xl = () => { const n = new Date(); return S.ev.filter(e => e.k === 'x' || e.k === 'a').map(e => ({ e, d: occ(e, n) })).filter(x => x.d).sort((a, b) => a.d - b.d) }

  const prStat = yms => {
    const c = [0, 0, 0, 0, 0]; let days = 0
    yms.forEach(m => {
      const nd = new Date(+m.slice(0, 4), +m.slice(5), 0).getDate(); days += nd
      for (let d = 1; d <= nd; d++) { const b = S.pr.d[m + '-' + P2(d)] || 0; for (let k = 0; k < 5; k++) if ((b >> k) & 1) c[k]++ }
    })
    const tot = c.reduce((a, b) => a + b, 0)
    return { c, days, tot, pos: days * 5 }
  }
  const evMonthList = ym => {
    const o = [], nd = new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate()
    for (let d = 1; d <= nd; d++) { const ds = ym + '-' + P2(d); S.ev.forEach(e => { if (evOn(e, ds)) o.push({ e, ds }) }) }
    return o.sort((a, b) => (a.ds < b.ds ? -1 : a.ds > b.ds ? 1 : RK[a.e.r || 'o'] - RK[b.e.r || 'o']))
  }

  return { AR, aix, cmp, TD, TM, st, byA, G, gp, ga, gdn, srtT, srtG, srtE, upc, upcE, xl, prStat, evMonthList }
}
