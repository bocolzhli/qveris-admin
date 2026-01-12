import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import './App.css'

const AUTH_TOKEN_KEY = 'qveris_admin_token'

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Tools', path: '/tools' },
  { label: 'Endpoints', path: '/endpoints' },
  { label: 'Invocations', path: '/invocations' },
  { label: 'Traces', path: '/traces' },
  { label: 'Errors', path: '/errors' },
  { label: 'API Keys', path: '/api-keys' },
  { label: 'Settings', path: '/settings' },
]

function Placeholder({ title, description }) {
  return (
    <div className="content-card">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

function Dashboard() {
  const [status, setStatus] = useState('loading')
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setStatus('error')
      return
    }

    const controller = new AbortController()

    const load = async () => {
      try {
        const response = await fetch('/admin/metrics', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load metrics')
        }
        const data = await response.json()
        setMetrics(data)
        setStatus('ready')
      } catch (error) {
        setStatus('error')
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  const volume = metrics?.request_volume ?? '--'
  const success = metrics ? `${metrics.success_rate}%` : '--'
  const errorRate = metrics ? `${metrics.error_rate}%` : '--'
  const latency =
    metrics?.latency_p95_ms !== null && metrics?.latency_p95_ms !== undefined
      ? `${metrics.latency_p95_ms} ms`
      : '--'

  const helperText =
    status === 'loading'
      ? 'Loading metrics...'
      : status === 'error'
        ? 'Metrics unavailable'
        : 'Updated within the last 24 hours.'

  return (
    <div className="dashboard-grid">
      <div className="content-card dashboard-hero">
        <h1>Dashboard</h1>
        <p>Monitor system health, throughput, and recent execution activity.</p>
      </div>
      <div className="widget-card">
        <div className="metric-header">
          <h3>Request Volume</h3>
          <span className="metric-helper">{helperText}</span>
        </div>
        <p className="metric-value">{volume}</p>
      </div>
      <div className="widget-card">
        <div className="metric-header">
          <h3>Success Rate</h3>
          <span className="metric-helper">{helperText}</span>
        </div>
        <p className="metric-value">{success}</p>
      </div>
      <div className="widget-card">
        <div className="metric-header">
          <h3>Error Rate</h3>
          <span className="metric-helper">{helperText}</span>
        </div>
        <p className="metric-value">{errorRate}</p>
      </div>
      <div className="widget-card">
        <div className="metric-header">
          <h3>Latency (p95)</h3>
          <span className="metric-helper">
            {metrics?.latency_p95_ms ? 'Latest readout' : 'Latency pending'}
          </span>
        </div>
        <p className="metric-value">{latency}</p>
      </div>
    </div>
  )
}

function ToolsList({ canEdit }) {
  const [status, setStatus] = useState('active')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [state, setState] = useState('loading')
  const [detailState, setDetailState] = useState('idle')
  const [selectedTool, setSelectedTool] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      return
    }

    const controller = new AbortController()

    const load = async () => {
      try {
        setState('loading')
        const response = await fetch(
          `/admin/tools?status=${status}&page=${page}&page_size=8`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        )
        if (!response.ok) {
          throw new Error('Failed to load tools')
        }
        const payload = await response.json()
        setData(payload)
        setState('ready')
      } catch (error) {
        setState('error')
      }
    }

    void load()
    return () => controller.abort()
  }, [status, page])

  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size))
  const helperText =
    state === 'loading'
      ? 'Loading tools...'
      : state === 'error'
        ? 'Unable to load tools.'
        : `${data.total} tools found.`

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h1>Tools</h1>
          <p>Manage registered tools, endpoints, and execution policies.</p>
        </div>
        {canEdit ? (
          <button className="primary-action" type="button">
            Create Tool
          </button>
        ) : (
          <span className="role-badge">Viewer</span>
        )}
      </div>
      <div className="tools-controls">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
        <span className="helper-text">{helperText}</span>
      </div>
      <div className="tools-table">
        <div className="tools-row tools-head">
          <span>Name</span>
          <span>Status</span>
          <span>Description</span>
        </div>
        {data.items.map((tool) => (
          <div key={tool.id} className="tools-row">
            <button
              className="tool-link"
              type="button"
              onClick={async () => {
                const token = localStorage.getItem(AUTH_TOKEN_KEY)
                if (!token) {
                  return
                }
                setDetailState('loading')
                setSelectedTool(null)
                try {
                  const response = await fetch(`/admin/tools/${tool.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  if (!response.ok) {
                    throw new Error('Failed to load tool')
                  }
                  const payload = await response.json()
                  setSelectedTool(payload)
                  setDetailState('ready')
                } catch (error) {
                  setDetailState('error')
                }
              }}
            >
              {tool.name}
            </button>
            <span className={tool.is_active ? 'status-pill active' : 'status-pill'}>
              {tool.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="tool-desc">{tool.description}</span>
          </div>
        ))}
        {state === 'ready' && data.items.length === 0 ? (
          <div className="tools-empty">No tools match this filter.</div>
        ) : null}
      </div>
      <div className="pagination">
        <button
          className="ghost-action"
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          className="ghost-action"
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
      {detailState !== 'idle' ? (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Tool Detail</p>
                <h2>{selectedTool?.name || 'Loading...'}</h2>
              </div>
              <button
                className="ghost-action"
                type="button"
                onClick={() => {
                  setDetailState('idle')
                  setSelectedTool(null)
                }}
              >
                Close
              </button>
            </div>
            {detailState === 'loading' ? (
              <p>Loading tool detail...</p>
            ) : detailState === 'error' ? (
              <p>Unable to load tool detail.</p>
            ) : (
              <div className="modal-body">
                <div>
                  <h3>Overview</h3>
                  <p>{selectedTool?.description}</p>
                </div>
                <div className="schema-grid">
                  <div>
                    <h4>Parameters Schema</h4>
                    <pre>{JSON.stringify(selectedTool?.parameters_schema, null, 2)}</pre>
                  </div>
                  <div>
                    <h4>Result Schema</h4>
                    <pre>{JSON.stringify(selectedTool?.result_schema, null, 2)}</pre>
                  </div>
                </div>
                <div className="meta-grid">
                  <div>
                    <h4>Capability Scope</h4>
                    <p>{selectedTool?.capability_scope || '—'}</p>
                  </div>
                  <div>
                    <h4>Required Fields</h4>
                    <p>{selectedTool?.required_fields_summary || '—'}</p>
                  </div>
                  <div>
                    <h4>Common Failures</h4>
                    <p>
                      {selectedTool?.common_failures
                        ? selectedTool.common_failures.join(', ')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RoleRoute({ allowedRoles, role, children }) {
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }
  return children
}

function LoginPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const payload = {
      username: String(formData.get('username') || ''),
      password: String(formData.get('password') || ''),
    }

    try {
      const response = await fetch('/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage('Invalid username or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark">Q</div>
          <div>
            <div className="brand-title">Qveris Admin</div>
            <div className="brand-subtitle">Secure access required</div>
          </div>
        </div>
        <h1>Sign in</h1>
        <p>Use your admin credentials to continue.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input name="username" type="text" placeholder="admin" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" placeholder="Enter password" required />
          </label>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          <button className="primary-action" type="submit">
            {isSubmitting ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminLayout({ role }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    if (token) {
      await fetch('/admin/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    navigate('/login', { replace: true })
  }

  const canEdit = role !== 'Viewer'

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">
          <div className="brand-mark">Q</div>
          <div>
            <div className="brand-title">Qveris Admin</div>
            <div className="brand-subtitle">Operations Console</div>
          </div>
        </div>
        <nav className="nav-list" aria-label="Admin">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end className="nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>Environment: Local</span>
          <span>Role: {role}</span>
        </div>
        <button className="ghost-action" type="button" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="admin-content">
        <header className="content-header">
          <div>
            <p className="eyebrow">Admin Overview</p>
            <h2>Keep execution visible and governed.</h2>
          </div>
          {canEdit ? (
            <button className="primary-action" type="button">
              Create Report
            </button>
          ) : null}
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard />
            }
          />
          <Route
            path="/tools"
            element={
              <ToolsList canEdit={canEdit} />
            }
          />
          <Route
            path="/endpoints"
            element={
              <Placeholder
                title="Endpoints"
                description="Review endpoint configurations, health status, and priorities."
              />
            }
          />
          <Route
            path="/invocations"
            element={
              <Placeholder
                title="Invocations"
                description="Review invocation history, traces, and error recovery outcomes."
              />
            }
          />
          <Route
            path="/traces"
            element={
              <Placeholder
                title="Traces"
                description="Explore trace timelines and drill into execution spans."
              />
            }
          />
          <Route
            path="/errors"
            element={
              <Placeholder
                title="Errors"
                description="Aggregate failures and identify recurring issues."
              />
            }
          />
          <Route
            path="/api-keys"
            element={
              <Placeholder
                title="API Keys"
                description="Manage API keys, owners, and access levels."
              />
            }
          />
          <Route
            path="/settings"
            element={
              <RoleRoute allowedRoles={['Admin', 'Operator']} role={role}>
                <div className="content-card">
                  <div className="card-header">
                    <div>
                      <h1>Settings</h1>
                      <p>Configure access controls, rate limits, and team settings.</p>
                    </div>
                    {canEdit ? (
                      <button className="primary-action" type="button">
                        Edit Settings
                      </button>
                    ) : (
                      <span className="role-badge">Viewer</span>
                    )}
                  </div>
                </div>
              </RoleRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function RequireAuth({ onRoleReady, children }) {
  const navigate = useNavigate()
  const token = useMemo(() => localStorage.getItem(AUTH_TOKEN_KEY), [])
  const [status, setStatus] = useState(token ? 'loading' : 'unauthenticated')

  useEffect(() => {
    if (!token) {
      setStatus('unauthenticated')
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const validate = async () => {
      try {
        const response = await fetch('/admin/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Session invalid')
        }
        const data = await response.json()
        if (isMounted) {
          onRoleReady(data.role)
          setStatus('authenticated')
        }
      } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        if (isMounted) {
          setStatus('unauthenticated')
        }
      }
    }

    void validate()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [token])

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login', { replace: true })
    }
  }, [status, navigate])

  if (status === 'loading') {
    return (
      <div className="loading-shell">
        <div className="loading-card">Checking session...</div>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return null
  }

  return children
}

function App() {
  const [role, setRole] = useState('Viewer')

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth onRoleReady={setRole}>
            <AdminLayout role={role} />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
