# Admin Console – Product Design

## 1. Goal & Audience
**Goal**
- Operate and govern the platform
- Ensure reliability, observability, and control

**Primary Users**
- Platform operators
- Internal engineers
- Enterprise customers (later)

---

## 2. Core Principles
- Operational clarity over beauty
- Everything traceable
- Failures are first-class citizens
- Safe-by-default

---

## 3. Navigation Structure

### Global Navigation
- Dashboard
- Tools
- Endpoints
- Invocations
- Traces
- Errors
- API Keys
- Settings

---

## 4. Pages & Functionality

### 4.1 Dashboard
**Purpose**
- System health at a glance

**Widgets**
- Requests per minute
- Success rate
- Error rate
- Avg / p95 latency
- Active tools
- Unhealthy endpoints

---

### 4.2 Tools Management
**Functions**
- Create / edit tool
- parameters_schema editor
- result_schema editor
- Metadata (scope, examples)
- Enable / disable tool

---

### 4.3 Endpoint Management
**Functions**
- Add / edit endpoint
- Priority & health status
- Last failure time
- Manual disable

---

### 4.4 Invocation Logs
**Functions**
- List invocations
- Filter by tool / status / caller
- View request + response
- Retry invocation (optional)

---

### 4.5 Trace Explorer
**Functions**
- View trace timeline
- See multi-step execution
- Jump between related calls

---

### 4.6 Error Center
**Functions**
- Error aggregation
- Top error types
- Retryable vs non-retryable
- Suggested actions surfaced

---

### 4.7 API Key Management
**Functions**
- Create / revoke keys
- Set quotas / limits
- View usage by key

---

### 4.8 Settings
**Sections**
- Organization info
- Rate limits
- SLA thresholds
- Alerting (future)

---

## 5. Permission Model (Future-Ready)
- Admin
- Operator
- Viewer

---

## 6. UX Notes
- Tables > charts
- Filters everywhere
- Copy-friendly JSON viewers
- Dark mode friendly

---

## 7. Success Metrics
- MTTR (mean time to recovery)
- Error detection latency
- Operator task completion time
