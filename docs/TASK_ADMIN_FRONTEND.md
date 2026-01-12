# TASK – Admin Console Frontend Implementation

## Purpose
This task list is derived from `FRD_ADMIN_CONSOLE.md`.
Each task is:
- Independently implementable
- Verifiable against FRD acceptance criteria
- Suitable for code-agent execution

---

## Phase 0 – Project Setup

### TASK-ADM-001 Project Scaffold
**Description**
- Initialize admin console frontend project (recommended: Next.js / React).
- Configure routing and base layout (sidebar + main content area).

**Acceptance Criteria**
- Project runs locally.
- Base layout renders sidebar and content container.

---

## Phase 1 – Auth & Access Control

### TASK-ADM-010 Authentication Gate
**Description**
- Implement login page and authentication gate for all admin routes.
- Enforce redirect to login when unauthenticated.

**Acceptance Criteria**
- Unauthenticated users cannot access any admin page.
- Authenticated users can access dashboard.

---

### TASK-ADM-011 Role-Based Access Control (RBAC) Wiring
**Description**
- Implement role model: Admin, Operator, Viewer.
- Add route-level and component-level guards.

**Acceptance Criteria**
- Viewer cannot access create/edit controls.
- Admin can access all modules.

---

## Phase 2 – Navigation

### TASK-ADM-020 Sidebar Navigation
**Description**
- Implement persistent sidebar navigation with links:
  - Dashboard
  - Tools
  - Endpoints
  - Invocations
  - Traces
  - Errors
  - API Keys
  - Settings

**Acceptance Criteria**
- Sidebar visible on all authenticated pages.
- Active module highlighted.
- Links route correctly.

---

## Phase 3 – Dashboard

### TASK-ADM-030 Dashboard Page Skeleton
**Description**
- Create dashboard page layout and placeholders.

**Acceptance Criteria**
- Dashboard route loads with no errors.
- Widget containers present.

---

### TASK-ADM-031 Health Metrics Widgets
**Description**
- Integrate API to display:
  - request volume
  - success rate
  - error rate
  - latency indicators

**Acceptance Criteria**
- Metrics are visible.
- Loading and error states handled.

---

## Phase 4 – Tool Management

### TASK-ADM-040 Tools List Page
**Description**
- Implement tools list table with pagination and filters.

**Acceptance Criteria**
- Tools list loads from API.
- Filter by status supported.
- Pagination works.

---

### TASK-ADM-041 Tool Detail Page
**Description**
- Implement tool detail view with:
  - read-only metadata
  - parameters_schema viewer/editor
  - result_schema viewer/editor
  - enable/disable toggle

**Acceptance Criteria**
- Tool can be viewed by all roles.
- Only Admin/Operator can edit (per RBAC rules).
- Disable action blocks invocation (UI reflects state).

---

### TASK-ADM-042 Tool Create/Edit Flow
**Description**
- Implement create and edit forms for tools.

**Acceptance Criteria**
- Validation errors shown clearly.
- Success redirects to tool detail.

---

## Phase 5 – Endpoint Management

### TASK-ADM-050 Endpoints List Page
**Description**
- Implement endpoints list table with health status and controls.

**Acceptance Criteria**
- Endpoint status visible.
- Manual disable available (RBAC protected).

---

### TASK-ADM-051 Endpoint Create/Edit Flow
**Description**
- Create and edit endpoint forms including priority.

**Acceptance Criteria**
- Priority saved.
- Health status displayed.

---

## Phase 6 – Invocation Logs

### TASK-ADM-060 Invocations List
**Description**
- Implement invocation logs list with filters:
  - tool
  - status
  - time range

**Acceptance Criteria**
- Filtering works.
- Pagination supported.

---

### TASK-ADM-061 Invocation Detail View
**Description**
- Implement invocation detail page with:
  - request payload
  - response payload
  - error display
  - trace link

**Acceptance Criteria**
- JSON viewer is copy-friendly.
- Trace link navigates to trace explorer.

---

## Phase 7 – Trace Explorer

### TASK-ADM-070 Trace Search
**Description**
- Implement trace search by trace_id.

**Acceptance Criteria**
- User can enter trace_id and view results.
- Empty state handled.

---

### TASK-ADM-071 Trace Timeline View
**Description**
- Show invocations in a trace in chronological order.

**Acceptance Criteria**
- Ordered list displayed.
- Each item links to invocation detail.

---

## Phase 8 – Error Center

### TASK-ADM-080 Error Aggregation View
**Description**
- Implement error center with aggregation by type.

**Acceptance Criteria**
- Retryable vs non-retryable visible.
- Can drill down to related invocations.

---

## Phase 9 – API Key Management

### TASK-ADM-090 API Keys List
**Description**
- Implement API keys list and usage summary.

**Acceptance Criteria**
- Keys load from API.
- Usage metrics visible.

---

### TASK-ADM-091 API Key Create/Revoke
**Description**
- Implement create and revoke actions with confirmation.

**Acceptance Criteria**
- Destructive actions require confirmation.
- RBAC enforced.

---

## Phase 10 – Settings

### TASK-ADM-100 Settings Page Skeleton
**Description**
- Implement settings page layout with placeholders.

**Acceptance Criteria**
- Page loads and sections visible.

---

### TASK-ADM-101 Rate Limit / SLA Threshold Config (UI)
**Description**
- Implement UI forms for rate limits and SLA thresholds (if APIs exist).
- If APIs do not exist, implement read-only placeholders.

**Acceptance Criteria**
- UI matches current backend capability (edit vs view-only).
- Clear messaging for unsupported actions.

---

## Phase 11 – Non-Functional Requirements

### TASK-ADM-110 Pagination & Large Data Handling
**Description**
- Ensure all list pages paginate and avoid loading excessive data.

**Acceptance Criteria**
- No list fetch loads unbounded items.
- Loading states present.

---

### TASK-ADM-111 Safety & Confirmation
**Description**
- Implement confirmation dialogs for destructive actions.

**Acceptance Criteria**
- Disable/delete/revoke actions always require confirmation.

---

## Completion Criteria
- All tasks completed.
- All FRD acceptance criteria satisfied.
- Admin console ready for internal operations.
