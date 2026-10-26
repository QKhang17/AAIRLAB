import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { getRoleConfig } from '../config/roles'
import { api } from '../services/api'

const sections = {
  ADMIN: [['users', 'Users'], ['audit-logs', 'Audit Logs']],
  MANAGER: [['documents', 'Documents'], ['sessions', 'Annotation Sessions'], ['tasks', 'Assignments']],
  AI_LABELER: [['tasks', 'AI Tasks'], ['prompts', 'AI Prompts']],
  MANUAL_LABELER: [['tasks', 'My Tasks']], REVIEWER: [['tasks', 'Review Queue']],
  RESULT_ANALYST: [['statistics', 'Statistical Reports'], ['tasks', 'Detailed Results']],
  TERMINOLOGY: [['terms', 'Terminology Base']],
}
const formDefaults = {
  users: { username: '', email: '', role: 'MANAGER' },
  terms: { term: '', definition: '', category: '', status: 'ACTIVE' },
  prompts: { name: '', description: '', content: '', model: '', active: true },
  sessions: { name: '', description: '', sessionType: 'MANUAL' },
}
function err(e) { return e?.message || 'Unable to load data.' }
function Table({ rows }) {
  if (!rows.length) return <p className="empty-state">No data available.</p>
  const cols = Object.keys(rows[0]).filter((key) => !['password', 'storage_path', 'detail', 'members'].includes(key))
  return <div className="data-table-wrap"><table className="data-table"><thead><tr>{cols.map((key) => <th key={key}>{key.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id ?? i}>{cols.map((key) => <td key={key}>{typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '—')}</td>)}</tr>)}</tbody></table></div>
}
function AddForm({ type, reload }) {
  const defaults = formDefaults[type]; const [open, setOpen] = useState(false); const [form, setForm] = useState(defaults); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  if (!defaults) return null
  const send = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await api(`/${type}`, { method: 'POST', body: JSON.stringify(form) }); setOpen(false); setForm(defaults); reload() } catch (reason) { setError(err(reason)) } finally { setBusy(false) } }
  return <><button className="button button--primary data-new" onClick={() => setOpen(!open)} type="button">Add New</button>{open && <form className="data-form" onSubmit={send}>{Object.keys(defaults).map((key) => {
    if (key === 'active') return <label key={key}><input checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} type="checkbox" /> Active</label>
    if (['definition', 'description', 'content'].includes(key)) return <label key={key}>{key}<textarea required={key !== 'description'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>
    if (key === 'role') return <label key={key}>Role<select value={form[key]} onChange={(e) => setForm({ ...form, role: e.target.value })}>{['ADMIN', 'MANAGER'].map((v) => <option key={v}>{v}</option>)}</select></label>
    if (key === 'status') return <label key={key}>Status<select value={form[key]} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select></label>
    if (key === 'sessionType') return <label key={key}>Session Type<select value={form[key]} onChange={(e) => setForm({ ...form, sessionType: e.target.value })}><option>MANUAL</option><option>AI</option><option>MIXED</option></select></label>
    return <label key={key}>{key}<input required={key !== 'category' && key !== 'model'} type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>
  })}{error && <p className="form-error">{error}</p>}<button className="button button--primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></form>}</>
}
export default function WorkspaceDataPage() {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const config = getRoleConfig(user.role); const groups = sections[user.role]; const [active, setActive] = useState(groups[0][0]); const [rows, setRows] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); setError(''); setRows([]); try { const result = await api(`/${active}`); const data = result.data; setRows(Array.isArray(data) ? data : Object.entries(data).flatMap(([group, value]) => Array.isArray(value) ? value.map((item) => ({ group, ...item })) : [{ group, value }])); } catch (reason) { setRows([]); setError(err(reason)) } finally { setLoading(false) } }
  useEffect(() => { let mounted = true; setRows([]); setLoading(true); setError(''); api(`/${active}`).then(result => { if (!mounted) return; const data = result.data; setRows(Array.isArray(data) ? data : Object.entries(data).flatMap(([group, value]) => Array.isArray(value) ? value.map((item) => ({ group, ...item })) : [{ group, value }])); }).catch(reason => { if (!mounted) return; setRows([]); setError(err(reason)); }).finally(() => { if (mounted) setLoading(false) }); return () => { mounted = false; } }, [active])
  return <div className="workspace" style={{ '--role-accent': config.accent }}><aside className="workspace-sidebar"><Brand /><div className="workspace-user"><span>{user.username.slice(0, 2).toUpperCase()}</span><div><strong>{user.username}</strong><small>{config.label}</small></div></div><nav className="workspace-nav"><Link to={config.route}><span className="material-symbols-outlined">grid_view</span>Overview</Link>{groups.map(([id, label]) => <button className={active === id ? 'active' : ''} key={id} onClick={() => setActive(id)} type="button"><span className="material-symbols-outlined">{id === 'tasks' ? 'assignment' : 'table_chart'}</span>{label}</button>)}</nav><div className="sidebar-bottom"><Link to="/"><span className="material-symbols-outlined">home</span>Home</Link><button onClick={() => { logout(); navigate('/login') }} type="button"><span className="material-symbols-outlined">logout</span>Log out</button></div></aside><main className="workspace-main"><header className="workspace-header"><div><p>{config.eyebrow}</p><strong>{config.label}</strong></div></header><div className="workspace-content"><div className="workspace-section__heading"><div><p className="section-kicker">SYSTEM DATA</p><h2>{groups.find(([id]) => id === active)[1]}</h2></div></div><AddForm type={active} reload={load} />{error && <p className="form-error">{error}</p>}{loading ? <p>Loading data…</p> : <Table rows={rows} />}</div></main></div>
}
