import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { useApp } from '../store'
import { pct } from '../utils'

/** Read named fields from a <form> into trimmed strings (checkbox -> boolean). */
export const formVals = form => {
  const o = {}
  for (const el of form.elements) {
    if (!el.name) continue
    o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim()
  }
  return o
}
/** onSubmit helper: run fn(values, form); reset the form unless fn returns false. */
export const sub = (fn, keep) => e => {
  e.preventDefault()
  const form = e.currentTarget
  const r = fn(formVals(form), form)
  if (r !== false && !keep) form.reset()
}

export const Bar = ({ p, c }) => <div className="bar"><i style={{ width: p + '%', background: c || 'var(--ac)' }} /></div>

export const Kpi = ({ l, v, s, c, x }) => (
  <div className={'c k ' + (x || '')}><span>{l}</span><b style={{ color: c }}>{v}</b><small>{s}</small></div>
)
export const Stat = ({ l, p, c, s }) => (
  <div className="c s"><div><b style={{ color: c }}>{l}</b><em style={{ color: c }}>{p}%</em></div><Bar p={p} c={c} /><small>{s}</small></div>
)

/** Long lists collapse behind a "Show more" button. */
export function Cl({ k, children }) {
  const { V, setV } = useApp()
  const ref = useRef(null)
  const [over, setOver] = useState(false)
  const open = !!V.open[k]
  useLayoutEffect(() => { const el = ref.current; if (el) setOver(el.scrollHeight > 450) })
  return (
    <>
      <div ref={ref} className={'cl' + (over && !open ? ' limit' : '')}>{children}</div>
      {over && <button className="xb" onClick={() => setV(v => ({ open: { ...v.open, [k]: !v.open[k] } }))}>{open ? 'Show less' : 'Show more'}</button>}
    </>
  )
}

/** Props that make an element open the Edit/Delete context menu on right-click. */
export const useCm = () => {
  const { setCx } = useApp()
  return key => ({ onContextMenu: e => { e.preventDefault(); setCx({ key, x: e.clientX, y: e.clientY }) } })
}

export function ContextMenu() {
  const { cx, setCx, setEdit, A } = useApp()
  useEffect(() => {
    if (!cx) return
    const close = () => setCx(null)
    window.addEventListener('click', close); window.addEventListener('scroll', close, true)
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true) }
  }, [cx, setCx])
  if (!cx) return null
  const d = cx.key.startsWith('df') ? ' default' : ''
  return (
    <div className="cx" style={{ left: Math.max(4, Math.min(cx.x, innerWidth - 150)), top: Math.max(4, Math.min(cx.y, innerHeight - 90)) }} onClick={e => e.stopPropagation()}>
      <button onClick={() => { setEdit(cx.key); setCx(null) }}>Edit{d}</button>
      <button onClick={() => { A.remove(cx.key); setCx(null) }}>Delete{d}</button>
    </div>
  )
}

export const Overlay = ({ onClose, z, children }) => (
  <div className="ov" style={z ? { zIndex: z } : undefined} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>{children}</div>
)

export const pc = pct
