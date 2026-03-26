# CREWUP — Pre-Launch Readiness Report
*Generated: 2026-03-26*

---

## ✅ Fixes Committed (All Pushed to Railway Except #10)

| # | Fix | Commit |
|---|-----|--------|
| 1 | Gmail SMTP as priority email provider (works for any recipient) | `b3a9941` |
| 2 | Waitlist launch email: "joined our waitlist early" (was "signed up early") | `a8efcb8` |
| 3 | Contest `createContest` now saves all fields (theme, maxDuration, allowedLanguages, rules, teamFormedAfter) | `5ebad8c` |
| 4 | Mentor booking: address hidden until booking is confirmed | `72749fb` |
| 5 | Email verification required to become a mentor or book a session | `72749fb` |
| 6 | Mentor dashboard: booking date range + blocked dates UI | `2ef7eac` |
| 7 | Mentee booking: free time-range picker (From/To) instead of fixed slots | `2ef7eac` |
| 8 | Mobile fix: booking modal slides up from bottom on small screens | `a08be27` |
| 9 | `.gitignore` completely rewritten — `.env` files untracked from git | `cf37bd9` |
| 10 | Crash emails to admin on `unhandledRejection` and `uncaughtException`, 500 errors logged with route info | `1aa7a08` |
| 11 | **Notification enum** — added `'general'` and `'report_submitted'` (prevented crashes on member-removed, member-left, and report events) | `1bbeb14` ← **push this now** |

---

## 🚀 Action Required Before Launch

### 1. Push the last commit
```
git push origin main
```
This deploys the Notification enum fix (commit `1bbeb14`).

### 2. Railway — Server environment variables (required)
Set these in your **server** service on Railway:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | your MongoDB Atlas connection string |
| `JWT_SECRET` | a long random secret |
| `CLIENT_URL` | `https://crewupfilms.com` (or your Railway client URL) |
| `NODE_ENV` | `production` |
| `SENDER_EMAIL` | `noreply@crewupfilms.com` |
| `SENDER_NAME` | `CREWUPFILMS` |
| `ADMIN_ALERT_EMAIL` | `crewupfilms@gmail.com` ← **crash alerts go here** |

#### Email (pick ONE of the following — first available is used):

**Option A — Gmail SMTP (recommended, any recipient):**
| `GMAIL_USER` | `crewupfilms@gmail.com` |
| `GMAIL_PASS` | your 16-char Gmail App Password (no spaces) |

**Option B — Resend (domain verified):**
| `RESEND_API_KEY` | your Resend API key |
| `RESEND_FROM` | `CREWUPFILMS <noreply@crewupfilms.com>` |

### 3. Railway — Client environment variables (required)
Set these in your **client** service on Railway:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-server.railway.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | your Google OAuth client ID |
| **`NEXT_PUBLIC_LAUNCH_MODE`** | **`public`** ← **CRITICAL: site stays on /waitlist without this** |

### 4. Optional but recommended
| Variable | Value | Why |
|----------|-------|-----|
| `NEXT_PUBLIC_ACCESS_KEY` | any secret string | Private beta invite key (if `LAUNCH_MODE=private`) |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Needed for film validation |
| `CONTACT_EMAIL` | `crewupfilms@gmail.com` | Contact form recipient |

---

## 🔍 Audit Findings — All Clear

### Server models
- All Notification enum types matched to every `Notification.create()` call across all controllers ✓
- Activity enum types matched to all `logActivity()` calls ✓
- MentorBooking has `startTime`, `endTime`, `meetingAddress`, `meetingLink` fields ✓
- User model has `isEmailVerified`, `emailOTP`, `resetPasswordToken` ✓
- Profile model has `mentorBookingDateFrom`, `mentorBookingDateTo`, `mentorBlockedDates` ✓

### Server
- `server.js` has graceful SIGTERM/SIGINT shutdown for Railway ✓
- Health check at `GET /api/health` with socket count ✓
- Rate limiting: 20 auth attempts/15min, 120 general req/min ✓
- CORS handles `CLIENT_URL` list with automatic www ↔ non-www expansion ✓
- All routes registered (25 route files, all imported and mounted) ✓
- `railway.toml` has correct `startCommand = "node src/server.js"` and `healthcheckPath = "/api/health"` ✓

### Email
- Priority order: Gmail SMTP → Brevo → Resend → custom SMTP ✓
- All email functions (booking, contest, waitlist, auth OTP, password reset) use the unified `sendEmail` helper ✓
- Booking request email hides in-person address while pending ✓
- Booking confirmed email reveals address to both parties ✓
- Launch email: "joined our waitlist early" ✓

### Client
- Middleware launch gate defaults to `private` — **must set `NEXT_PUBLIC_LAUNCH_MODE=public` in Railway** ✓
- Email verification page exists and auto-sends OTP ✓
- Mentor booking modal has free time-range picker with date range and blocked date enforcement ✓
- Email verification gate on "Book Session" button redirects to `/verify-email` ✓
- `.gitignore` properly excludes `.env`, `node_modules`, `.next` ✓

---

## 📊 Post-Launch Error Monitoring

### Where to look for errors:
1. **Railway logs** — Go to your server service → Deployments → View logs. All 500 errors are logged with the format: `[SERVER ERROR] POST /api/auth/login → <stack trace>`
2. **Crash alert emails** — Any `unhandledRejection` or `uncaughtException` sends an email to `ADMIN_ALERT_EMAIL` with the full stack trace
3. **Railway metrics** — CPU, memory, and request count are visible in the Railway dashboard

### Common errors to watch for on Day 1:
- **401/403 on API calls** — JWT_SECRET mismatch between deploys (rare but possible after redeploy)
- **500 on email sends** — Check GMAIL_USER/GMAIL_PASS or RESEND_API_KEY is set correctly
- **500 on contest create** — Would be a new schema mismatch (unlikely after fix)
- **CORS errors in browser console** — CLIENT_URL doesn't match the actual frontend domain

---

## ✅ Launch Checklist

- [ ] `git push origin main` — deploy Notification enum fix
- [ ] Set `NEXT_PUBLIC_LAUNCH_MODE=public` in Railway client
- [ ] Set `ADMIN_ALERT_EMAIL=crewupfilms@gmail.com` in Railway server
- [ ] Confirm GMAIL_USER + GMAIL_PASS set (or RESEND with verified domain)
- [ ] Test sign-up flow end-to-end (register → verify email → dashboard)
- [ ] Test booking flow (browse mentor → book → mentor confirms → both get emails)
- [ ] Test contest submission from a project
- [ ] Click "Send Launch Emails" from admin panel for waitlist
- [ ] Monitor Railway logs for first 30 minutes

---

*All 11 fixes are committed. Only one commit (`1bbeb14`) needs `git push origin main` to deploy.*
