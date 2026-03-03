---
name: code-review
description: Run a multi-perspective code review on recent changes using specialized reviewer personas. Each reviewer focuses on their domain — security, ops, cross-platform, API design, frontend, and performance. Produces a dated review report.
argument-hint: "[file, directory, or git range]"
---

# Code Review — Multi-Perspective Audit

Review code from the perspective of 6 specialized reviewers, each with their own focus area. Produces a structured report in `.reviews/`.

## Scope

Determine what to review based on the argument:

- **No argument**: Review all uncommitted changes (`git diff` + `git diff --cached`)
- **A file or directory path**: Review that specific path
- **A git range** (e.g., `main..HEAD`, `HEAD~3`): Review that commit range
- **`last`**: Review the last commit (`HEAD~1..HEAD`)

## The Reviewers

### Mara — Security

Focuses on authentication, authorization, and injection vectors.

- JWT handling: token validation, expiry, refresh flows
- SQL injection: raw queries, unparameterized input
- XSS: unsanitized user input rendered in responses or frontend
- CORS misconfigurations
- Path traversal in file operations (`../` in user-supplied paths)
- Secrets in code (API keys, passwords, hardcoded tokens)
- Missing `@jwt_required()` on API routes that need auth
- CSRF protection gaps

### Raj — Ops & Infrastructure

Focuses on subprocess calls, privilege escalation, and system operations.

- Missing `sudo` on privileged commands (systemctl, firewall-cmd, ufw, certbot, nginx)
- Raw `subprocess.run()` that should use `run_privileged()`, `ServiceControl`, or `PackageManager`
- Missing error handling on subprocess calls (unchecked `returncode`, no try/except)
- Hardcoded paths that assume specific filesystem layout
- Logging gaps: operations that modify system state without logging what they did
- Service restart ordering issues

### Sol — Cross-Platform & Containers

Focuses on portability across distros and container environments.

- Distro-specific commands (`dpkg`, `apt`, `rpm`, `dnf`) without `FileNotFoundError` handling
- Unguarded `/proc/` and `/sys/` reads that fail in LXC/containers
- `psutil` calls that return `None` in containers (`disk_io_counters`, `sensors_temperatures`) used without null checks
- Docker socket assumptions without availability checks
- Firewall commands that need `CAP_NET_ADMIN` (dropped in unprivileged LXC)
- Hardcoded `/dev/` device paths
- Assumptions about init system (systemd vs others)
- Package manager detection that only checks one family

### Kai — API Design

Focuses on REST conventions, error handling, and request/response patterns.

- Inconsistent error response format (should always be `{'error': 'message'}, status_code`)
- Missing input validation on request body fields
- Wrong HTTP status codes (e.g., 200 on error, 404 when it should be 403)
- Missing pagination on list endpoints
- Endpoints that return too much data (no field filtering)
- Inconsistent URL naming (`/api/v1/` prefix, plural nouns)
- Missing rate limiting on sensitive endpoints (login, password reset)
- N+1 query patterns in endpoints that return lists

### Lena — Frontend

Focuses on React patterns, UX quality, and style consistency.

- Class components or non-hook patterns (should be functional + hooks only)
- Inline styles (should use LESS with design system variables)
- Missing loading states or error handling on data fetches
- Accessibility gaps: missing alt text, aria labels, keyboard navigation
- Hardcoded strings that should come from the API or config
- Memory leaks: missing cleanup in `useEffect`
- Props drilling beyond 3 levels (should use Context)
- Missing key props in lists
- Console.log left in production code

### Omar — Performance

Focuses on efficiency, caching, and resource usage.

- Synchronous blocking calls that should be async (especially subprocess calls in request handlers)
- Missing database indexes on frequently queried columns
- Unbounded queries: `SELECT *` without `LIMIT` or pagination
- Repeated identical subprocess calls that could be cached
- Large file reads loaded entirely into memory
- Frontend: unnecessary re-renders, missing `useMemo`/`useCallback` where expensive
- Missing `timeout` on subprocess calls or external HTTP requests
- Socket.IO events that broadcast too frequently

## How to Review

1. Determine the scope from `$ARGUMENTS` and read all relevant code
2. For each reviewer, analyze the code **only through their lens** — don't overlap
3. Rate each finding:
   - **Fix** — Bug, vulnerability, or will break in production. Must address.
   - **Improve** — Works but suboptimal. Should address.
   - **Note** — Observation or suggestion. Nice to know, no action needed.
4. Collect all findings

## Report

Create the `.reviews/` directory if it doesn't exist. Write to `.reviews/YYYY-MM-DD-review.md` (use today's date). If a file for today exists, append a counter: `YYYY-MM-DD-2-review.md`.

```markdown
# Code Review — YYYY-MM-DD

**Scope:** <what was reviewed>
**Files reviewed:** N

## Summary

| Reviewer | Focus | Fix | Improve | Note |
|----------|-------|-----|---------|------|
| Mara     | Security | N | N | N |
| Raj      | Ops | N | N | N |
| Sol      | Cross-Platform | N | N | N |
| Kai      | API Design | N | N | N |
| Lena     | Frontend | N | N | N |
| Omar     | Performance | N | N | N |
| **Total** | | **N** | **N** | **N** |

## Findings

### Mara — Security

#### [Fix] Short description
`file_path:line_number`
Explanation of the issue and why it matters.
**Suggested fix:** What to change.

#### [Improve] Short description
...

### Raj — Ops & Infrastructure
...

### Sol — Cross-Platform & Containers
...

### Kai — API Design
...

### Lena — Frontend
...

### Omar — Performance
...

## Verdict

**PASS** — No Fix-severity findings. Ship it.
or
**NEEDS WORK** — N Fix-severity findings must be addressed before merging.
```

After writing the report, print the summary table and verdict to the user. If there are Fix-severity findings, ask if they want you to address them now.
