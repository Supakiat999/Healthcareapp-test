# Architecture Decisions & Tech Stack

## Why Supabase?

### Comparison: Supabase vs Firebase vs Node.js

|  | **Supabase** | **Firebase** | **Node.js + Postgres** |
|---|---|---|---|
| **Setup time** | 5 min ✅ | 10 min | 2+ hours |
| **Auth** | Built-in + Social | Built-in + Social | Need passport.js |
| **Database** | Postgres (powerful) | Firestore (limited) | Postgres (powerful) |
| **RLS** | Excellent ✅ | Complex | Manual (more errors) |
| **Realtime** | Built-in ✅ | Built-in | Need Socket.io |
| **Cost (MVP)** | Free tier ✅ | Free tier | ~$5/mo (server) |
| **Scaling** | Easy ✅ | Can be expensive | Manual DevOps |
| **Data export** | Easy SQL ✅ | Complex | Easy SQL ✅ |
| **GDPR compliant** | Yes ✅ | Partial | Yes ✅ |
| **Medical data** | Production-grade ✅ | Possible | Production-grade ✅ |
| **Learning curve** | Low ✅ | Medium | High |

**Winner: Supabase** for this project because:
1. ✅ Auth + database + RLS all built-in (less code to write)
2. ✅ Postgres is battle-tested for sensitive data
3. ✅ Free tier is actually usable (not just a demo)
4. ✅ Row-Level Security prevents data leaks automatically
5. ✅ Can export/migrate anytime if needed

---

## Tech Stack Rationale

### Frontend (ccgp6.html)
- **HTML/CSS/JavaScript**: Already working. No build step needed.
- **Tailwind CSS**: Responsive design, medical app look
- **Font Awesome**: Icons
- **Vanilla JS**: No framework complexity for MVP

**Why no React?**
→ For this MVP, plain JS + Tailwind is faster. React adds bundling, transpiling, learning curve.
→ Can move to React later if UI complexity grows.

### Backend (Supabase)
- **Postgres database**: Industry standard, powerful, reliable
- **Supabase Auth**: Email + password (can add Google/GitHub/Apple later)
- **Row-Level Security (RLS)**: Automatic user isolation
- **Realtime subscriptions**: Community feed updates live
- **Edge functions**?: Not needed yet (save that for Phase 2)

**Why Postgres not Firebase/Firestore?**
→ Medical data is structured. Postgres enforces schema.
→ Queries are more powerful (trends, analytics).
→ Easier to migrate/export data if needed.

---

## Security Model

### Data Isolation (RLS)

```sql
-- Every table has user_id + RLS policy
-- Even if someone hacks the anon key, they can only see THEIR data

-- Example: screenings table
CREATE POLICY "Users can view own screenings" ON public.screenings
  FOR SELECT USING (auth.uid() = user_id);
```

This means:
- User A logs in with auth token A → can only SELECT rows where user_id = A
- User B logs in with auth token B → can only SELECT rows where user_id = B
- Even if User A gets User B's auth token, RLS still blocks access

**No need for custom permission code.**

### Encryption

- Supabase encrypts data at rest (default)
- HTTPS encrypts in transit (browser → Supabase)
- Passwords are hashed by Supabase Auth

### Audit Trail

```sql
-- Every sensitive action logged
INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
VALUES ('user123', 'screening_created', 'screenings', 'screening456');
```

Useful for:
- GDPR compliance ("what did this user access?")
- Debugging ("when did they download data?")
- Fraud detection

---

## Database Design Philosophy

### For Screenings:

```sql
CREATE TABLE screenings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,          -- Link to user
  
  answers JSONB,                   -- Raw answers (audit trail)
  bmi DECIMAL(5,2),               -- Computed values
  tds_percent DECIMAL(5,2),
  achievement_level INTEGER,      -- Gamification
  
  created_at TIMESTAMP,           -- Timeline
);
```

**Why JSONB for answers?**
- Flexible: questions might change over time
- Auditable: can see exactly what user answered
- Queryable: can still filter by `answers->>'age'` if needed

**Why separate computed scores?**
- Fast queries: no need to recalculate every time
- Consistent: scores never change after save
- Searchable: can sort by TDS without parsing JSON

---

## Community Moderation

```sql
-- Posts + Comments
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID,                   -- Who posted
  content TEXT,
  is_anonymous BOOLEAN,           -- Can hide name
  deleted_at TIMESTAMP,           -- Soft delete (not hard delete)
);

-- Reports for moderation
CREATE TABLE reports (
  id UUID,
  reported_post_id UUID,          -- What's being reported
  reporter_user_id UUID,          -- Who reported it
  reason TEXT,                    -- 'spam', 'abuse', 'misinformation'
);
```

**Why soft deletes?**
- Never lose data (GDPR: can audit what was there)
- Moderation trail (can see who reported what)
- Reversible (if report was false positive)

**Why anonymous posting option?**
- Stigma reduction (people talk about mental health more freely)
- But still tied to account! (can track abusers)

---

## Payment Integration (Future)

```sql
CREATE TABLE subscriptions (
  id UUID,
  user_id UUID,
  plan TEXT,                      -- 'free' or 'premium'
  stripe_subscription_id TEXT,    -- Link to Stripe
  current_period_end TIMESTAMP,   -- When renewal happens
);
```

When ready:
1. Add Stripe webhook → POST /webhooks/stripe
2. Function checks if payment succeeded
3. Update subscription table
4. RLS policy checks `subscription.plan = 'premium'` for premium-only features

---

## API Endpoint Design

### RESTful? GraphQL? Direct DB?

**We're doing: Direct Client (via Supabase RLS)**

```javascript
// Instead of: POST /api/screenings + auth headers
// We do: supabase.from('screenings').insert(data)
// RLS automatically checks user_id
```

**Why?**
- No middle layer to code/debug
- Fewer round-trips (fewer requests)
- RLS handles security
- Still production-grade

**When to add REST API layer?**
- If you need rate limiting
- If mobile app needs offline sync
- If integrations with other systems
- If you need to add complex business logic

For MVP: **direct client → Supabase RLS = fine** ✅

---

## Scaling Path

```
Phase 1 (MVP): ccgp6.html → Supabase (this setup)
├─ Free tier: ~unlimited
└─ Can handle ~1000 active users comfortably

Phase 2 (Growth): Add caching layer
├─ Screening stats cached in Redis
├─ Community feed paginated
└─ Still free tier for DB, add Redis (~$5/mo)

Phase 3 (Scale): Add API gateway
├─ Node.js/Nest.js proxy for complex queries
├─ Rate limiting, analytics, A/B tests
├─ But database stays Supabase Postgres
└─ Cost: $25/mo API server + $50/mo DB

Phase 4 (Enterprise): Full separation if needed
├─ Supabase → managed Postgres + custom API
├─ Can even migrate data out at this point
└─ Cost: $200+/mo for ops team
```

**Key point: You won't outgrow Supabase. It scales with you.**

---

## Compliance & Privacy

### GDPR Ready ✅

```javascript
// Users can download all their data
await exportUserData();
// → Returns: { screenings, habits, posts, ... }

// Users can delete their account
await deleteUserAccount();
// → Cascades: deletes user + all their data via foreign keys
```

### HIPAA Considerations

⚠️ Supabase free tier is NOT HIPAA-compliant as-is.

For production healthcare app:
1. Upgrade to Supabase Enterprise (HIPAA BAA)
2. Or use AWS HealthLake / Google Cloud Healthcare API
3. Or move to regulated hosting

For this **screening + community** app:
- Add disclaimer: "Not a medical diagnosis"
- Treat as health tracking tool, not medical record
- Still encrypt data (do it anyway)
- Still audit log access (do it anyway)

Can upgrade compliance later if needed.

---

## Monitoring & Errors

### What to Expect

```javascript
// Network error
const result = await saveScreening(...);
if (!result.success) {
  console.error(result.error); // Network timeout, etc
}

// Auth error
const user = await getCurrentUser();
if (!user) {
  // User not logged in, show login screen
}

// RLS error
// Automatically blocked by Supabase (returns 403)
```

### Debugging

In browser console:
```javascript
// Check current user
const user = await getCurrentUser();
console.log(user);

// Check what data you can access
const result = await getScreeningHistory();
console.log(result);

// Check error detail
if (!result.success) {
  console.error(result.error);
  // Copy error → paste into Supabase docs search
}
```

In Supabase dashboard:
- **Auth** tab: see all signups/logins
- **Table editor**: browse all data
- **SQL logs**: see queries running
- **Real-time**: see subscriptions active

---

## Dev Workflow

```bash
# Day-to-day work:
1. Edit ccgp6.html locally
2. Open in browser → test
3. Supabase saves changes automatically
4. No build step, no deploy needed

# When schema changes:
1. Go to Supabase SQL Editor
2. Write SQL (or run migration)
3. Done (no rebuild, instant)

# When deploying:
1. Commit to GitHub
2. Deploy to Vercel (auto from git)
3. Points to same Supabase DB
4. No DNS changes, no downtime
```

---

## Cost Breakdown (Rough Estimates)

### Current (MVP Phase 1):
```
Supabase free tier:       $0
Domain name:              $1/month
Total:                    ~$1/month ✅
```

### At 100 active users (Phase 2):
```
Supabase pro tier:        $25/month
Domain:                   $1/month
Total:                    ~$26/month
```

### At 1000 active users (Phase 3):
```
Supabase + custom API:    $75/month
Domain:                   $1/month
CDN caching:              $5/month
Total:                    ~$80/month
```

### Enterprise (Phase 4):
```
Managed infrastructure:   $200-500/month
Data center redundancy:   Included
Compliance support:       Included
Total:                    Depends on SLA
```

---

## Conclusion

This architecture:
✅ Works today (Supabase + HTML/JS)
✅ Scales up (can reach enterprise)
✅ Secure by default (RLS, encryption)
✅ Privacy-first (GDPR ready)
✅ Cost-effective (free → $25/mo)
✅ Medical-appropriate (proper schemas)

Need questions answered? Check BACKEND-README.md or API-REFERENCE.md!
