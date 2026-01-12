import { NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [status, setStatus] = useState('active')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [state, setState] = useState('loading')

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
          <button className="primary-action" type="button" onClick={() => navigate('/tools/new')}>
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
              onClick={() => navigate(`/tools/${tool.id}`)}
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
    </div>
  )
}

function EndpointsList({ canEdit }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('active')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [state, setState] = useState('loading')
  const [actionState, setActionState] = useState({})

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
          `/admin/endpoints?status=${status}&page=${page}&page_size=8`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        )
        if (!response.ok) {
          throw new Error('Failed to load endpoints')
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
      ? 'Loading endpoints...'
      : state === 'error'
        ? 'Unable to load endpoints.'
        : `${data.total} endpoints found.`

  const formatTimestamp = (value) => {
    if (!value) {
      return '—'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }
    return date.toLocaleString()
  }

  const updateEndpoint = async (endpointId, isActive) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      return
    }
    setActionState((prev) => ({ ...prev, [endpointId]: 'saving' }))
    try {
      const response = await fetch(`/admin/endpoints/${endpointId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      })
      if (!response.ok) {
        throw new Error('Failed to update endpoint')
      }
      const payload = await response.json()
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === endpointId ? { ...item, ...payload } : item
        ),
      }))
      setActionState((prev) => ({ ...prev, [endpointId]: 'saved' }))
    } catch (error) {
      setActionState((prev) => ({ ...prev, [endpointId]: 'error' }))
    } finally {
      setTimeout(() => {
        setActionState((prev) => {
          const next = { ...prev }
          delete next[endpointId]
          return next
        })
      }, 1200)
    }
  }

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h1>Endpoints</h1>
          <p>Monitor endpoint health, priorities, and execution readiness.</p>
        </div>
        {canEdit ? (
          <button className="primary-action" type="button" onClick={() => navigate('/endpoints/new')}>
            Add Endpoint
          </button>
        ) : (
          <span className="role-badge">Viewer</span>
        )}
      </div>
      <div className="tools-controls">
        <div className="filter-group">
          <label htmlFor="endpoint-status-filter">Status</label>
          <select
            id="endpoint-status-filter"
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
      <div className="endpoints-table">
        <div className="endpoints-row endpoints-head">
          <span>Tool</span>
          <span>Type</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Health</span>
          <span>Last Checked</span>
          <span>Controls</span>
        </div>
        {data.items.map((endpoint) => {
          const action = actionState[endpoint.id]
          return (
            <div key={endpoint.id} className="endpoints-row">
              <span className="endpoint-tool">{endpoint.tool_name}</span>
              <span>{endpoint.type}</span>
              <span className={endpoint.is_active ? 'status-pill active' : 'status-pill'}>
                {endpoint.is_active ? 'Active' : 'Inactive'}
              </span>
              <span>{endpoint.priority}</span>
              <span className={`health-pill ${String(endpoint.health_status).toLowerCase()}`}>
                {endpoint.health_status}
              </span>
              <span className="endpoint-meta">{formatTimestamp(endpoint.last_checked_at)}</span>
              <div className="endpoint-controls">
                {canEdit ? (
                  <div className="endpoint-action-group">
                    <button
                      className="ghost-action"
                      type="button"
                      onClick={() => navigate(`/endpoints/${endpoint.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      className="ghost-action"
                      type="button"
                      onClick={() => updateEndpoint(endpoint.id, !endpoint.is_active)}
                      disabled={action === 'saving'}
                    >
                      {action === 'saving'
                        ? 'Saving...'
                        : endpoint.is_active
                          ? 'Disable'
                          : 'Enable'}
                    </button>
                  </div>
                ) : (
                  <span className="role-badge">Viewer</span>
                )}
              </div>
            </div>
          )
        })}
        {state === 'ready' && data.items.length === 0 ? (
          <div className="tools-empty">No endpoints match this filter.</div>
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
    </div>
  )
}

function EndpointFormPage({ mode, canEdit }) {
  const navigate = useNavigate()
  const { endpointId } = useParams()
  const [state, setState] = useState(mode === 'edit' ? 'loading' : 'ready')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitState, setSubmitState] = useState('idle')
  const [toolsState, setToolsState] = useState('loading')
  const [tools, setTools] = useState([])
  const [form, setForm] = useState({
    toolId: '',
    toolName: '',
    type: 'HTTP',
    config: '{\n  \n}',
    priority: '0',
    isActive: true,
    healthStatus: 'UNKNOWN',
  })

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setToolsState('error')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch('/admin/tools?status=active&page=1&page_size=50', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load tools')
        }
        const payload = await response.json()
        setTools(payload.items ?? [])
        setToolsState('ready')
      } catch (error) {
        setToolsState('error')
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (mode !== 'edit') {
      return
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      setErrorMessage('Missing session token.')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch(`/admin/endpoints/${endpointId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load endpoint')
        }
        const payload = await response.json()
        setForm({
          toolId: payload.tool_id,
          toolName: payload.tool_name,
          type: payload.type,
          config: JSON.stringify(payload.config ?? {}, null, 2),
          priority: String(payload.priority ?? 0),
          isActive: payload.is_active,
          healthStatus: payload.health_status ?? 'UNKNOWN',
        })
        setState('ready')
      } catch (error) {
        setState('error')
        setErrorMessage('Unable to load endpoint detail.')
      }
    }
    void load()
    return () => controller.abort()
  }, [mode, endpointId])

  useEffect(() => {
    if (mode === 'create' && toolsState === 'ready' && tools.length && !form.toolId) {
      setForm((prev) => ({ ...prev, toolId: tools[0].id }))
    }
  }, [mode, toolsState, tools, form.toolId])

  const updateField = (key) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canEdit) {
      return
    }
    setErrorMessage('')

    if (mode === 'create' && !form.toolId) {
      setErrorMessage('Select a tool for this endpoint.')
      return
    }
    if (!form.priority.trim() || Number.isNaN(Number(form.priority))) {
      setErrorMessage('Priority must be a valid number.')
      return
    }

    let config = null
    try {
      config = JSON.parse(form.config)
    } catch (error) {
      setErrorMessage('Config must be valid JSON.')
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setErrorMessage('Missing session token.')
      return
    }

    const payload =
      mode === 'edit'
        ? {
            config,
            priority: Number(form.priority),
            is_active: form.isActive,
          }
        : {
            tool_id: form.toolId,
            type: form.type,
            config,
            priority: Number(form.priority),
          }

    setSubmitState('saving')
    try {
      const response = await fetch(
        mode === 'edit' ? `/admin/endpoints/${endpointId}` : '/admin/endpoints',
        {
          method: mode === 'edit' ? 'PATCH' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        const errorText = detail?.detail || 'Unable to save endpoint.'
        throw new Error(errorText)
      }
      await response.json()
      navigate('/endpoints')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save endpoint.')
      setSubmitState('error')
    } finally {
      setTimeout(() => setSubmitState('idle'), 1500)
    }
  }

  if (!canEdit) {
    return (
      <div className="content-card">
        <h1>Access restricted</h1>
        <p>You do not have permission to manage endpoints.</p>
        <button className="ghost-action" type="button" onClick={() => navigate('/endpoints')}>
          Back to Endpoints
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="content-card">
        <p>Loading endpoint detail...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="content-card">
        <h1>Endpoint Editor</h1>
        <p>{errorMessage || 'Unable to load endpoint detail.'}</p>
        <button className="ghost-action" type="button" onClick={() => navigate('/endpoints')}>
          Back to Endpoints
        </button>
      </div>
    )
  }

  return (
    <div className="content-card tool-form-card">
      <div className="card-header tool-detail-header">
        <div>
          <p className="eyebrow">{mode === 'edit' ? 'Edit Endpoint' : 'Create Endpoint'}</p>
          <h1>{mode === 'edit' ? 'Update endpoint settings' : 'Register a new endpoint'}</h1>
          <p>Define configuration, priority, and operational state.</p>
        </div>
        <button className="ghost-action" type="button" onClick={() => navigate('/endpoints')}>
          Back to Endpoints
        </button>
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <form className="tool-form" onSubmit={handleSubmit}>
        {mode === 'create' ? (
          <label className="field">
            <span>Tool *</span>
            <select
              value={form.toolId}
              onChange={updateField('toolId')}
              disabled={toolsState !== 'ready' || tools.length === 0}
              required
            >
              {toolsState === 'ready' && tools.length === 0 ? (
                <option value="">No tools available</option>
              ) : (
                tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))
              )}
            </select>
          </label>
        ) : (
          <label className="field">
            <span>Tool</span>
            <input value={form.toolName} disabled />
          </label>
        )}
        <div className="form-grid">
          <label className="field">
            <span>Endpoint Type *</span>
            <select value={form.type} onChange={updateField('type')} disabled={mode === 'edit'}>
              <option value="HTTP">HTTP</option>
            </select>
          </label>
          <label className="field">
            <span>Priority *</span>
            <input value={form.priority} onChange={updateField('priority')} required />
          </label>
          <label className="field">
            <span>Health Status</span>
            <input value={form.healthStatus} disabled />
          </label>
          {mode === 'edit' ? (
            <label className="field">
              <span>Active</span>
              <select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.value === 'active' }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          ) : null}
        </div>
        <label className="field">
          <span>Config (JSON) *</span>
          <textarea
            className="schema-editor"
            value={form.config}
            onChange={updateField('config')}
            rows={12}
            required
          />
        </label>
        <div className="form-actions">
          <button className="ghost-action" type="button" onClick={() => navigate('/endpoints')}>
            Cancel
          </button>
          <button className="primary-action" type="submit" disabled={submitState === 'saving'}>
            {submitState === 'saving' ? 'Saving...' : 'Save Endpoint'}
          </button>
        </div>
      </form>
    </div>
  )
}

function InvocationsList() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [toolFilter, setToolFilter] = useState('all')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [tools, setTools] = useState([])
  const [toolsState, setToolsState] = useState('loading')

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setToolsState('error')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch('/admin/tools?status=all&page=1&page_size=50', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load tools')
        }
        const payload = await response.json()
        setTools(payload.items ?? [])
        setToolsState('ready')
      } catch (error) {
        setToolsState('error')
      }
    }
    void load()
    return () => controller.abort()
  }, [])

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
        const params = new URLSearchParams({
          status: statusFilter,
          page: String(page),
          page_size: '10',
        })
        if (toolFilter !== 'all') {
          params.set('tool_id', toolFilter)
        }
        if (startTime) {
          params.set('start', new Date(startTime).toISOString())
        }
        if (endTime) {
          params.set('end', new Date(endTime).toISOString())
        }
        const response = await fetch(`/admin/invocations?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load invocations')
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
  }, [statusFilter, toolFilter, startTime, endTime, page])

  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size))
  const helperText =
    state === 'loading'
      ? 'Loading invocations...'
      : state === 'error'
        ? 'Unable to load invocations.'
        : `${data.total} invocations found.`

  const formatTimestamp = (value) => {
    if (!value) {
      return '—'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }
    return date.toLocaleString()
  }

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h1>Invocations</h1>
          <p>Review invocation history, trace IDs, and response outcomes.</p>
        </div>
      </div>
      <div className="tools-controls">
        <div className="filter-group">
          <label htmlFor="invocation-tool-filter">Tool</label>
          <select
            id="invocation-tool-filter"
            value={toolFilter}
            onChange={handleFilterChange(setToolFilter)}
            disabled={toolsState !== 'ready'}
          >
            <option value="all">All</option>
            {tools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="invocation-status-filter">Status</label>
          <select
            id="invocation-status-filter"
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="invocation-start-filter">Start</label>
          <input
            id="invocation-start-filter"
            type="datetime-local"
            value={startTime}
            onChange={handleFilterChange(setStartTime)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="invocation-end-filter">End</label>
          <input
            id="invocation-end-filter"
            type="datetime-local"
            value={endTime}
            onChange={handleFilterChange(setEndTime)}
          />
        </div>
        <span className="helper-text">{helperText}</span>
      </div>
      <div className="invocations-table">
        <div className="invocations-row invocations-head">
          <span>Tool</span>
          <span>Status</span>
          <span>HTTP</span>
          <span>Caller</span>
          <span>Trace</span>
          <span>Summary</span>
          <span>Created</span>
          <span>Details</span>
        </div>
        {data.items.map((log) => (
          <div key={log.id} className="invocations-row">
            <span className="invocation-tool">{log.tool_name}</span>
            <span className={`status-pill ${log.status === 'success' ? 'active' : ''}`}>
              {log.status}
            </span>
            <span>{log.response_status_code}</span>
            <span className="invocation-meta">{log.caller_id || '—'}</span>
            <span className="invocation-meta">{log.trace_id}</span>
            <span className="invocation-summary">{log.response_summary || '—'}</span>
            <span className="invocation-meta">{formatTimestamp(log.created_at)}</span>
            <div className="invocation-actions">
              <button
                className="ghost-action"
                type="button"
                onClick={() => navigate(`/invocations/${log.id}`)}
              >
                View
              </button>
            </div>
          </div>
        ))}
        {state === 'ready' && data.items.length === 0 ? (
          <div className="tools-empty">No invocations match this filter.</div>
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
    </div>
  )
}

function InvocationDetail() {
  const { invocationId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [detail, setDetail] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [copyState, setCopyState] = useState({})

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      setErrorMessage('Missing session token.')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch(`/admin/invocations/${invocationId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load invocation')
        }
        const payload = await response.json()
        setDetail(payload)
        setState('ready')
      } catch (error) {
        setState('error')
        setErrorMessage('Unable to load invocation detail.')
      }
    }
    void load()
    return () => controller.abort()
  }, [invocationId])

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyState((prev) => ({ ...prev, [key]: 'Copied' }))
    } catch (error) {
      setCopyState((prev) => ({ ...prev, [key]: 'Failed' }))
    } finally {
      setTimeout(() => {
        setCopyState((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }, 1200)
    }
  }

  if (state === 'loading') {
    return (
      <div className="content-card">
        <p>Loading invocation detail...</p>
      </div>
    )
  }

  if (state === 'error' || !detail) {
    return (
      <div className="content-card">
        <h1>Invocation Detail</h1>
        <p>{errorMessage || 'Unable to load invocation detail.'}</p>
        <button className="ghost-action" type="button" onClick={() => navigate('/invocations')}>
          Back to Invocations
        </button>
      </div>
    )
  }

  const requestPayload = JSON.stringify(detail.request_arguments ?? {}, null, 2)
  const responsePayload =
    detail.response_summary && detail.response_summary.trim()
      ? detail.response_summary
      : '—'

  return (
    <div className="content-card invocation-detail-card">
      <div className="card-header tool-detail-header">
        <div>
          <p className="eyebrow">Invocation Detail</p>
          <h1>{detail.tool_name}</h1>
          <p>Invocation {detail.id}</p>
        </div>
        <div className="tool-detail-actions">
          <button className="ghost-action" type="button" onClick={() => navigate('/invocations')}>
            Back to Invocations
          </button>
          <button
            className="ghost-action"
            type="button"
            onClick={() =>
              navigate(`/traces?trace_id=${encodeURIComponent(detail.trace_id || '')}`)
            }
          >
            View Trace
          </button>
        </div>
      </div>
      {detail.error_message ? (
        <div className="status-banner">
          {detail.error_message}
        </div>
      ) : null}
      <div className="tool-meta-grid">
        <div>
          <h4>Status</h4>
          <p>{detail.status}</p>
        </div>
        <div>
          <h4>HTTP</h4>
          <p>{detail.response_status_code}</p>
        </div>
        <div>
          <h4>Caller</h4>
          <p>{detail.caller_id || '—'}</p>
        </div>
        <div>
          <h4>Trace</h4>
          <p>{detail.trace_id || '—'}</p>
        </div>
      </div>
      <div className="invocation-detail-grid">
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h3>Request Payload</h3>
            <button
              className="ghost-action"
              type="button"
              onClick={() => handleCopy('request', requestPayload)}
            >
              {copyState.request || 'Copy'}
            </button>
          </div>
          <pre className="summary-content">{requestPayload}</pre>
        </div>
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h3>Response Payload</h3>
            <button
              className="ghost-action"
              type="button"
              onClick={() => handleCopy('response', responsePayload)}
            >
              {copyState.response || 'Copy'}
            </button>
          </div>
          <pre className="summary-content">{responsePayload}</pre>
        </div>
      </div>
    </div>
  )
}

function TraceSearch() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTraceId = searchParams.get('trace_id') || ''
  const [traceId, setTraceId] = useState(initialTraceId)
  const [state, setState] = useState('idle')
  const [logs, setLogs] = useState([])

  const loadTrace = async (value) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setLogs([])
      setState('idle')
      return
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      return
    }
    setState('loading')
    try {
      const response = await fetch(`/admin/traces/${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Failed to load trace')
      }
      const payload = await response.json()
      setLogs(payload.items ?? [])
      setState('ready')
    } catch (error) {
      setState('error')
    }
  }

  useEffect(() => {
    if (initialTraceId) {
      void loadTrace(initialTraceId)
    }
  }, [])

  const helperText =
    state === 'loading'
      ? 'Loading trace...'
      : state === 'error'
        ? 'Unable to load trace.'
        : logs.length
          ? `${logs.length} invocation(s) found.`
          : 'Enter a trace ID to search.'

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h1>Trace Explorer</h1>
          <p>Search trace IDs to review invocation sequences.</p>
        </div>
      </div>
      <form
        className="trace-search"
        onSubmit={(event) => {
          event.preventDefault()
          const value = traceId.trim()
          setSearchParams(value ? { trace_id: value } : {})
          void loadTrace(value)
        }}
      >
        <label className="field trace-field">
          <span>Trace ID</span>
          <input
            value={traceId}
            onChange={(event) => setTraceId(event.target.value)}
            placeholder="Enter trace id"
          />
        </label>
        <button className="primary-action" type="submit">
          Search
        </button>
      </form>
      <span className="helper-text">{helperText}</span>
      {state === 'ready' && logs.length ? (
        <div className="trace-table">
          <div className="trace-row trace-head">
            <span>Step</span>
            <span>Tool</span>
            <span>Status</span>
            <span>HTTP</span>
            <span>Caller</span>
            <span>Summary</span>
            <span>Created</span>
            <span>Details</span>
          </div>
          {logs.map((log, index) => (
            <div key={log.id} className="trace-row">
              <span className="trace-step">{index + 1}</span>
              <span className="invocation-tool">{log.tool_name}</span>
              <span className={`status-pill ${log.status === 'success' ? 'active' : ''}`}>
                {log.status}
              </span>
              <span>{log.response_status_code}</span>
              <span className="invocation-meta">{log.caller_id || '—'}</span>
              <span className="invocation-summary">{log.response_summary || '—'}</span>
              <span className="invocation-meta">{new Date(log.created_at).toLocaleString()}</span>
              <div className="trace-actions">
                <button
                  className="ghost-action"
                  type="button"
                  onClick={() => navigate(`/invocations/${log.id}`)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : state === 'ready' ? (
        <div className="tools-empty">No invocations found for this trace.</div>
      ) : null}
    </div>
  )
}

function ErrorAggregationView() {
  const [state, setState] = useState('loading')
  const [items, setItems] = useState([])

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch('/admin/errors', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load errors')
        }
        const payload = await response.json()
        setItems(payload.items ?? [])
        setState('ready')
      } catch (error) {
        setState('error')
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  const helperText =
    state === 'loading'
      ? 'Loading errors...'
      : state === 'error'
        ? 'Unable to load errors.'
        : `${items.length} error groups found.`

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h1>Error Center</h1>
          <p>Aggregate failures by tool and error signature.</p>
        </div>
      </div>
      <span className="helper-text">{helperText}</span>
      <div className="errors-table">
        <div className="errors-row errors-head">
          <span>Error</span>
          <span>Tool</span>
          <span>Count</span>
          <span>Last Seen</span>
          <span>Retryable</span>
        </div>
        {items.map((item, index) => (
          <div key={`${item.error_message}-${index}`} className="errors-row">
            <span className="error-message">{item.error_message}</span>
            <span className="error-tool">{item.tool_name}</span>
            <span>{item.count}</span>
            <span className="invocation-meta">
              {item.last_seen ? new Date(item.last_seen).toLocaleString() : '—'}
            </span>
            <span className="retry-pill">{item.retryable ?? '—'}</span>
          </div>
        ))}
        {state === 'ready' && items.length === 0 ? (
          <div className="tools-empty">No errors logged yet.</div>
        ) : null}
      </div>
    </div>
  )
}

function ApiKeysList({ canEdit }) {
  const [state, setState] = useState('loading')
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 })
  const [items, setItems] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [owner, setOwner] = useState('')
  const [createState, setCreateState] = useState('idle')
  const [createdKey, setCreatedKey] = useState(null)
  const [revokeTarget, setRevokeTarget] = useState(null)

  const loadKeys = async (signal) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      return
    }
    try {
      const response = await fetch('/admin/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      if (!response.ok) {
        throw new Error('Failed to load API keys')
      }
      const payload = await response.json()
      setItems(payload.items ?? [])
      setSummary({
        total: payload.total ?? 0,
        active: payload.active ?? 0,
        inactive: payload.inactive ?? 0,
      })
      setState('ready')
    } catch (error) {
      setState('error')
    }
  }

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
        await loadKeys(controller.signal)
      } catch (error) {
        setState('error')
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  const helperText =
    state === 'loading'
      ? 'Loading API keys...'
      : state === 'error'
        ? 'Unable to load API keys.'
        : `${items.length} keys loaded.`

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h1>API Keys</h1>
          <p>Monitor key inventory, activation status, and usage volume.</p>
        </div>
        {canEdit ? (
          <button className="primary-action" type="button" onClick={() => setShowCreate(true)}>
            Create Key
          </button>
        ) : (
          <span className="role-badge">Viewer</span>
        )}
      </div>
      <div className="api-summary">
        <div className="summary-card">
          <span>Total Keys</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="summary-card">
          <span>Active Keys</span>
          <strong>{summary.active}</strong>
        </div>
        <div className="summary-card">
          <span>Inactive Keys</span>
          <strong>{summary.inactive}</strong>
        </div>
      </div>
      <span className="helper-text">{helperText}</span>
      <div className="api-keys-table">
        <div className="api-keys-row api-keys-head">
          <span>Owner</span>
          <span>Status</span>
          <span>Created</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="api-keys-row">
            <span className="api-owner">{item.owner}</span>
            <span className={item.is_active ? 'status-pill active' : 'status-pill'}>
              {item.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="invocation-meta">
              {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
            </span>
            <div className="api-keys-actions">
              {canEdit ? (
                <button
                  className="ghost-action"
                  type="button"
                  onClick={() => setRevokeTarget(item)}
                  disabled={!item.is_active}
                >
                  Revoke
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {state === 'ready' && items.length === 0 ? (
          <div className="tools-empty">No API keys created yet.</div>
        ) : null}
      </div>
      {showCreate ? (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Create API Key</p>
                <h2>Generate a new key</h2>
              </div>
              <button className="ghost-action" type="button" onClick={() => setShowCreate(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <label className="field">
                <span>Owner</span>
                <input value={owner} onChange={(event) => setOwner(event.target.value)} />
              </label>
              {createdKey ? (
                <div className="summary-content">{createdKey}</div>
              ) : null}
              <div className="form-actions">
                <button className="ghost-action" type="button" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button
                  className="primary-action"
                  type="button"
                  disabled={!owner.trim() || createState === 'saving'}
                  onClick={async () => {
                    const token = localStorage.getItem(AUTH_TOKEN_KEY)
                    if (!token) {
                      return
                    }
                    setCreateState('saving')
                    try {
                      const response = await fetch('/admin/api-keys', {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ owner: owner.trim() }),
                      })
                      if (!response.ok) {
                        throw new Error('Failed to create key')
                      }
                      const payload = await response.json()
                      setCreatedKey(payload.key)
                      await loadKeys()
                    } catch (error) {
                      setCreateState('error')
                    } finally {
                      setCreateState('idle')
                    }
                  }}
                >
                  {createState === 'saving' ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {revokeTarget ? (
        <div className="modal-backdrop" onClick={() => setRevokeTarget(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Revoke API Key</p>
                <h2>{revokeTarget.owner}</h2>
              </div>
              <button className="ghost-action" type="button" onClick={() => setRevokeTarget(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>This action disables the key immediately and cannot be undone.</p>
              <div className="form-actions">
                <button className="ghost-action" type="button" onClick={() => setRevokeTarget(null)}>
                  Cancel
                </button>
                <button
                  className="primary-action"
                  type="button"
                  onClick={async () => {
                    const token = localStorage.getItem(AUTH_TOKEN_KEY)
                    if (!token) {
                      return
                    }
                    try {
                      await fetch(`/admin/api-keys/${revokeTarget.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                      })
                      setRevokeTarget(null)
                      await loadKeys()
                    } catch (error) {
                      setRevokeTarget(null)
                    }
                  }}
                >
                  Confirm Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ToolDetail({ canEdit }) {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [tool, setTool] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [draft, setDraft] = useState({
    parametersText: '',
    resultText: '',
    isActive: true,
  })
  const [saveState, setSaveState] = useState('idle')

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      setErrorMessage('Missing session token.')
      return
    }

    const controller = new AbortController()

    const load = async () => {
      try {
        setState('loading')
        const response = await fetch(`/admin/tools/${toolId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load tool')
        }
        const payload = await response.json()
        setTool(payload)
        setDraft({
          parametersText: JSON.stringify(payload.parameters_schema, null, 2),
          resultText:
            payload.result_schema === null || payload.result_schema === undefined
              ? ''
              : JSON.stringify(payload.result_schema, null, 2),
          isActive: payload.is_active,
        })
        setState('ready')
      } catch (error) {
        setState('error')
        setErrorMessage('Unable to load tool detail.')
      }
    }

    void load()
    return () => controller.abort()
  }, [toolId])

  const hasChanges =
    tool &&
    (draft.isActive !== tool.is_active ||
      draft.parametersText.trim() !== JSON.stringify(tool.parameters_schema, null, 2) ||
      draft.resultText.trim() !==
        (tool.result_schema === null || tool.result_schema === undefined
          ? ''
          : JSON.stringify(tool.result_schema, null, 2)))

  const handleSave = async () => {
    if (!tool) {
      return
    }
    setErrorMessage('')
    let parametersSchema = null
    let resultSchema = null

    try {
      if (!draft.parametersText.trim()) {
        throw new Error('Parameters schema is required.')
      }
      parametersSchema = JSON.parse(draft.parametersText)
    } catch (error) {
      setErrorMessage('Parameters schema must be valid JSON.')
      return
    }

    if (draft.resultText.trim()) {
      try {
        resultSchema = JSON.parse(draft.resultText)
      } catch (error) {
        setErrorMessage('Result schema must be valid JSON.')
        return
      }
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setErrorMessage('Missing session token.')
      return
    }

    setSaveState('saving')
    try {
      const response = await fetch(`/admin/tools/${tool.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters_schema: parametersSchema,
          result_schema: resultSchema,
          is_active: draft.isActive,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update tool')
      }
      const payload = await response.json()
      setTool(payload)
      setDraft({
        parametersText: JSON.stringify(payload.parameters_schema, null, 2),
        resultText:
          payload.result_schema === null || payload.result_schema === undefined
            ? ''
            : JSON.stringify(payload.result_schema, null, 2),
        isActive: payload.is_active,
      })
      setSaveState('saved')
    } catch (error) {
      setSaveState('error')
      setErrorMessage('Unable to save changes.')
    } finally {
      setTimeout(() => setSaveState('idle'), 1500)
    }
  }

  const resetDraft = () => {
    if (!tool) {
      return
    }
    setDraft({
      parametersText: JSON.stringify(tool.parameters_schema, null, 2),
      resultText:
        tool.result_schema === null || tool.result_schema === undefined
          ? ''
          : JSON.stringify(tool.result_schema, null, 2),
      isActive: tool.is_active,
    })
    setErrorMessage('')
  }

  if (state === 'loading') {
    return (
      <div className="content-card">
        <p>Loading tool detail...</p>
      </div>
    )
  }

  if (state === 'error' || !tool) {
    return (
      <div className="content-card">
        <h1>Tool Detail</h1>
        <p>{errorMessage || 'Unable to load tool detail.'}</p>
        <button className="ghost-action" type="button" onClick={() => navigate('/tools')}>
          Back to Tools
        </button>
      </div>
    )
  }

  return (
    <div className="content-card tool-detail-card">
      <div className="card-header tool-detail-header">
        <div>
          <p className="eyebrow">Tool Detail</p>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
        </div>
        <div className="tool-detail-actions">
          <button className="ghost-action" type="button" onClick={() => navigate('/tools')}>
            Back to Tools
          </button>
          {canEdit ? (
            <button
              className="ghost-action"
              type="button"
              onClick={() => navigate(`/tools/${tool.id}/edit`)}
            >
              Edit Tool
            </button>
          ) : null}
          {canEdit ? (
            <button
              className="primary-action"
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saveState === 'saving'}
            >
              {saveState === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <span className="role-badge">Viewer</span>
          )}
        </div>
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {!tool.is_active ? (
        <div className="status-banner">
          Tool is disabled. Invocations are blocked until it is re-enabled.
        </div>
      ) : null}
      <div className="tool-status-row">
        <span className={tool.is_active ? 'status-pill active' : 'status-pill'}>
          {tool.is_active ? 'Active' : 'Inactive'}
        </span>
        <label className={`toggle ${!canEdit ? 'is-disabled' : ''}`}>
          <input
            type="checkbox"
            checked={draft.isActive}
            disabled={!canEdit}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                isActive: event.target.checked,
              }))
            }
          />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span>{draft.isActive ? 'Enabled' : 'Disabled'}</span>
        </label>
        {canEdit ? (
          <button className="ghost-action" type="button" onClick={resetDraft} disabled={!hasChanges}>
            Discard
          </button>
        ) : null}
      </div>
      <div className="tool-meta-grid">
        <div>
          <h4>Tags</h4>
          <p>{tool.tags?.length ? tool.tags.join(', ') : '—'}</p>
        </div>
        <div>
          <h4>Capability Scope</h4>
          <p>{tool.capability_scope || '—'}</p>
        </div>
        <div>
          <h4>Required Fields</h4>
          <p>{tool.required_fields_summary || '—'}</p>
        </div>
        <div>
          <h4>Common Failures</h4>
          <p>{tool.common_failures?.length ? tool.common_failures.join(', ') : '—'}</p>
        </div>
        <div>
          <h4>Input Examples</h4>
          <p>{tool.input_examples?.length ? `${tool.input_examples.length} samples` : '—'}</p>
        </div>
        <div>
          <h4>Active Endpoints</h4>
          <p>{tool.endpoints?.length ?? 0}</p>
        </div>
      </div>
      <div className="tool-schema-grid">
        <div>
          <h3>Parameters Schema</h3>
          {canEdit ? (
            <textarea
              className="schema-editor"
              value={draft.parametersText}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  parametersText: event.target.value,
                }))
              }
              rows={14}
            />
          ) : (
            <pre>{JSON.stringify(tool.parameters_schema, null, 2)}</pre>
          )}
        </div>
        <div>
          <h3>Result Schema</h3>
          {canEdit ? (
            <textarea
              className="schema-editor"
              value={draft.resultText}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  resultText: event.target.value,
                }))
              }
              rows={14}
            />
          ) : (
            <pre>{JSON.stringify(tool.result_schema, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolFormPage({ mode, canEdit }) {
  const navigate = useNavigate()
  const { toolId } = useParams()
  const [state, setState] = useState(mode === 'edit' ? 'loading' : 'ready')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitState, setSubmitState] = useState('idle')
  const [form, setForm] = useState({
    name: '',
    description: '',
    tags: '',
    capabilityScope: '',
    parametersSchema: '{\n  \n}',
    resultSchema: '',
    inputExamples: '',
    requiredFieldsSummary: '',
    commonFailures: '',
  })

  useEffect(() => {
    if (mode !== 'edit') {
      return
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setState('error')
      setErrorMessage('Missing session token.')
      return
    }
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch(`/admin/tools/${toolId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load tool')
        }
        const payload = await response.json()
        setForm({
          name: payload.name ?? '',
          description: payload.description ?? '',
          tags: payload.tags?.join(', ') ?? '',
          capabilityScope: payload.capability_scope ?? '',
          parametersSchema: JSON.stringify(payload.parameters_schema, null, 2),
          resultSchema:
            payload.result_schema === null || payload.result_schema === undefined
              ? ''
              : JSON.stringify(payload.result_schema, null, 2),
          inputExamples:
            payload.input_examples === null || payload.input_examples === undefined
              ? ''
              : JSON.stringify(payload.input_examples, null, 2),
          requiredFieldsSummary: payload.required_fields_summary ?? '',
          commonFailures: payload.common_failures?.join(', ') ?? '',
        })
        setState('ready')
      } catch (error) {
        setState('error')
        setErrorMessage('Unable to load tool detail.')
      }
    }
    void load()
    return () => controller.abort()
  }, [mode, toolId])

  const updateField = (key) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const parseJsonField = (value, fieldLabel, allowEmpty) => {
    if (allowEmpty && !value.trim()) {
      return null
    }
    try {
      return JSON.parse(value)
    } catch (error) {
      throw new Error(`${fieldLabel} must be valid JSON.`)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canEdit) {
      return
    }
    setErrorMessage('')
    if (!form.name.trim() || !form.description.trim()) {
      setErrorMessage('Name and description are required.')
      return
    }

    let parametersSchema = null
    let resultSchema = null
    let inputExamples = null
    try {
      parametersSchema = parseJsonField(form.parametersSchema, 'Parameters schema', false)
      resultSchema = parseJsonField(form.resultSchema, 'Result schema', true)
      inputExamples = parseJsonField(form.inputExamples, 'Input examples', true)
    } catch (error) {
      setErrorMessage(error.message)
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      tags: form.tags.trim()
        ? form.tags
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : null,
      parameters_schema: parametersSchema,
      result_schema: resultSchema,
      capability_scope: form.capabilityScope.trim() || null,
      input_examples: inputExamples,
      required_fields_summary: form.requiredFieldsSummary.trim() || null,
      common_failures: form.commonFailures.trim()
        ? form.commonFailures
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : null,
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setErrorMessage('Missing session token.')
      return
    }

    setSubmitState('saving')
    try {
      const response = await fetch(mode === 'edit' ? `/admin/tools/${toolId}` : '/admin/tools', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        const errorText = detail?.detail || 'Unable to save tool.'
        throw new Error(errorText)
      }
      const data = await response.json()
      navigate(`/tools/${data.id}`)
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save tool.')
      setSubmitState('error')
    } finally {
      setTimeout(() => setSubmitState('idle'), 1500)
    }
  }

  if (!canEdit) {
    return (
      <div className="content-card">
        <h1>Access restricted</h1>
        <p>You do not have permission to manage tools.</p>
        <button className="ghost-action" type="button" onClick={() => navigate('/tools')}>
          Back to Tools
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="content-card">
        <p>Loading tool detail...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="content-card">
        <h1>Tool Editor</h1>
        <p>{errorMessage || 'Unable to load tool detail.'}</p>
        <button className="ghost-action" type="button" onClick={() => navigate('/tools')}>
          Back to Tools
        </button>
      </div>
    )
  }

  return (
    <div className="content-card tool-form-card">
      <div className="card-header tool-detail-header">
        <div>
          <p className="eyebrow">{mode === 'edit' ? 'Edit Tool' : 'Create Tool'}</p>
          <h1>{mode === 'edit' ? 'Update tool configuration' : 'Register a new tool'}</h1>
          <p>Define metadata, schemas, and operational guidance for tool usage.</p>
        </div>
        <button className="ghost-action" type="button" onClick={() => navigate('/tools')}>
          Back to Tools
        </button>
      </div>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <form className="tool-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name *</span>
          <input value={form.name} onChange={updateField('name')} required />
        </label>
        <label className="field">
          <span>Description *</span>
          <textarea
            value={form.description}
            onChange={updateField('description')}
            rows={3}
            required
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Tags</span>
            <input
              value={form.tags}
              onChange={updateField('tags')}
              placeholder="search, analytics"
            />
          </label>
          <label className="field">
            <span>Capability Scope</span>
            <input
              value={form.capabilityScope}
              onChange={updateField('capabilityScope')}
              placeholder="Summarize usage boundaries"
            />
          </label>
          <label className="field">
            <span>Required Fields Summary</span>
            <input
              value={form.requiredFieldsSummary}
              onChange={updateField('requiredFieldsSummary')}
            />
          </label>
          <label className="field">
            <span>Common Failures</span>
            <input
              value={form.commonFailures}
              onChange={updateField('commonFailures')}
              placeholder="rate limit, missing field"
            />
          </label>
        </div>
        <div className="tool-schema-grid">
          <label className="field">
            <span>Parameters Schema *</span>
            <textarea
              className="schema-editor"
              value={form.parametersSchema}
              onChange={updateField('parametersSchema')}
              rows={14}
              required
            />
          </label>
          <label className="field">
            <span>Result Schema</span>
            <textarea
              className="schema-editor"
              value={form.resultSchema}
              onChange={updateField('resultSchema')}
              rows={14}
            />
          </label>
        </div>
        <label className="field">
          <span>Input Examples (JSON array)</span>
          <textarea
            className="schema-editor"
            value={form.inputExamples}
            onChange={updateField('inputExamples')}
            rows={8}
          />
        </label>
        <div className="form-actions">
          <button className="ghost-action" type="button" onClick={() => navigate('/tools')}>
            Cancel
          </button>
          <button className="primary-action" type="submit" disabled={submitState === 'saving'}>
            {submitState === 'saving' ? 'Saving...' : 'Save Tool'}
          </button>
        </div>
      </form>
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
            path="/tools/new"
            element={
              <RoleRoute allowedRoles={['Admin', 'Operator']} role={role}>
                <ToolFormPage mode="create" canEdit={canEdit} />
              </RoleRoute>
            }
          />
          <Route
            path="/tools/:toolId"
            element={
              <ToolDetail canEdit={canEdit} />
            }
          />
          <Route
            path="/tools/:toolId/edit"
            element={
              <RoleRoute allowedRoles={['Admin', 'Operator']} role={role}>
                <ToolFormPage mode="edit" canEdit={canEdit} />
              </RoleRoute>
            }
          />
          <Route
            path="/endpoints"
            element={
              <EndpointsList canEdit={canEdit} />
            }
          />
          <Route
            path="/endpoints/new"
            element={
              <RoleRoute allowedRoles={['Admin', 'Operator']} role={role}>
                <EndpointFormPage mode="create" canEdit={canEdit} />
              </RoleRoute>
            }
          />
          <Route
            path="/endpoints/:endpointId/edit"
            element={
              <RoleRoute allowedRoles={['Admin', 'Operator']} role={role}>
                <EndpointFormPage mode="edit" canEdit={canEdit} />
              </RoleRoute>
            }
          />
          <Route
            path="/invocations"
            element={
              <InvocationsList />
            }
          />
          <Route
            path="/invocations/:invocationId"
            element={
              <InvocationDetail />
            }
          />
          <Route
            path="/traces"
            element={
              <TraceSearch />
            }
          />
          <Route
            path="/errors"
            element={
              <ErrorAggregationView />
            }
          />
          <Route
            path="/api-keys"
            element={
              <ApiKeysList canEdit={canEdit} />
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
