# Thai NCD Screening App - API Reference

## Quick Reference

All functions are in `supabase-client.js`. This document shows every function you can call from ccgp6.html.

---

## Authentication

### `signUpUser(email, password, fullName)`
Create new account

**Parameters:**
- `email` (string): User email
- `password` (string): 6+ characters
- `fullName` (string): User's full name

**Returns:**
```javascript
{ 
  success: true/false, 
  user: { id, email, ... }, 
  error: "error message if failed"
}
```

**Example:**
```javascript
const result = await signUpUser('john@example.com', 'password123', 'John Doe');
if (result.success) {
  console.log('Welcome!', result.user.id);
}
```

---

### `signInUser(email, password)`
Log in to existing account

**Parameters:**
- `email` (string)
- `password` (string)

**Returns:** `{ success, user, error }`

**Example:**
```javascript
const result = await signInUser('john@example.com', 'password123');
```

---

### `signOutUser()`
Log out current user

**Returns:** `{ success, error }`

**Example:**
```javascript
await signOutUser();
// User is signed out
```

---

### `getCurrentUser()`
Get currently logged-in user object

**Returns:** User object or `null` if not logged in

**Example:**
```javascript
const user = await getCurrentUser();
if (user) {
  console.log('Logged in as:', user.email);
} else {
  console.log('Not logged in');
}
```

---

## Screenings

### `saveScreening(answersData, computedScores, achievement)`
Save a completed screening assessment

**Parameters:**
- `answersData` (object): All user answers from form
- `computedScores` (object): Calculated health metrics
- `achievement` (object): Achievement level & XP

**Returns:** `{ success, screening, error }`

**Example:**
```javascript
const result = await saveScreening(
  {
    age: 45,
    sex: 'male',
    weight: 75,
    height: 170,
    sbp: 135,
    dbp: 85,
    // ...all other answers
  },
  {
    bmi: 25.9,
    tdsPct: 12.5,
    sbp: 135,
    dbp: 85,
    dScore: 6,
    stScore: 4,
    tdsRiskLevel: 'moderate',
    bpCategory: 'elevated',
    dietCategory: 'fair',
    stressLevel: 'low',
  },
  {
    level: 2,
    title: 'Health Conscious',
    xp: 20,
    icon: '💪'
  }
);

if (result.success) {
  console.log('Saved as screening ID:', result.screening.id);
}
```

---

### `getScreeningHistory(limit)`
Get past screening results for current user

**Parameters:**
- `limit` (number, optional): How many to retrieve (default: 20)

**Returns:**
```javascript
{
  success: true/false,
  screenings: [
    {
      id: "uuid",
      user_id: "uuid",
      bmi: 25.9,
      tds_percent: 12.5,
      sbp: 135,
      dbp: 85,
      diet_score: 6,
      stress_score: 4,
      achievement_level: 2,
      achievement_title: "Health Conscious",
      xp_earned: 20,
      created_at: "2026-02-16T10:30:00Z",
      // ... more fields
    },
    // ... more screenings (oldest first)
  ],
  error: "error message if failed"
}
```

**Example:**
```javascript
const result = await getScreeningHistory(10);
if (result.success) {
  console.log(`You have ${result.screenings.length} past screenings`);
  result.screenings.forEach(screening => {
    console.log(`${screening.created_at}: BMI ${screening.bmi}, TDS ${screening.tds_percent}%`);
  });
}
```

---

### `getScreeningStats()`
Get averaged statistics over all screenings

**Returns:**
```javascript
{
  success: true/false,
  stats: {
    totalScreenings: 5,
    latestBMI: 25.9,
    latestTDS: 12.5,
    averageBMI: 26.2,
    averageTDS: 13.8,
    bmiTrend: -0.3,          // Change from oldest to latest
    tdsTrend: -1.3,          // Negative = improvement
  },
  error: "..."
}
```

**Example:**
```javascript
const result = await getScreeningStats();
if (result.success) {
  const { stats } = result;
  console.log(`Latest: BMI ${stats.latestBMI}, TDS ${stats.latestTDS}%`);
  console.log(`Trend: BMI ${stats.bmiTrend > 0 ? 'increasing' : 'decreasing'}`);
}
```

---

## Community Posts

### `createPost(content, topic, isAnonymous)`
Create a new post in community feed

**Parameters:**
- `content` (string): Post text
- `topic` (string, optional): 'general', 'diet', 'exercise', 'smoking', 'stress' (default: 'general')
- `isAnonymous` (boolean, optional): Hide your name

**Returns:** `{ success, post, error }`

**Example:**
```javascript
const result = await createPost(
  'วันนี้เดินได้ 10,000 ก้าว! 🚶',
  'exercise',
  false
);

if (result.success) {
  console.log('Post created:', result.post.id);
}
```

---

### `getPosts(topic, limit)`
Get community posts

**Parameters:**
- `topic` (string, optional): Filter by topic (or null for all)
- `limit` (number, optional): How many (default: 20)

**Returns:**
```javascript
{
  success: true/false,
  posts: [
    {
      id: "uuid",
      content: "วันนี้เดินได้ 10,000 ก้าว! 🚶",
      topic: "exercise",
      likes_count: 24,
      comments_count: 3,
      created_at: "2026-02-16T09:30:00Z",
      users: {
        full_name: "น้อยน้อย"
      }
    },
    // ... more posts
  ],
  error: "..."
}
```

**Example:**
```javascript
// Get all posts
const result = await getPosts(null, 50);

// Get only exercise posts
const exercisePosts = await getPosts('exercise', 10);

if (result.success) {
  result.posts.forEach(post => {
    console.log(`${post.users.full_name}: ${post.content}`);
    console.log(`❤️ ${post.likes_count} | 💬 ${post.comments_count}`);
  });
}
```

---

### `likePost(postId)`
Add your like to a post

**Parameters:**
- `postId` (string): UUID of the post

**Returns:** `{ success, error }`

**Example:**
```javascript
const result = await likePost('550e8400-e29b-41d4-a716-446655440000');
if (result.success) {
  console.log('Post liked!');
}
```

---

### `createComment(postId, content)`
Add comment to a post

**Parameters:**
- `postId` (string): UUID of the post
- `content` (string): Your comment text

**Returns:** `{ success, comment, error }`

**Example:**
```javascript
const result = await createComment(
  '550e8400-e29b-41d4-a716-446655440000',
  'เก่ง! ลองเดิน 15,000 ต่อไป! 💪'
);
```

---

### `reportPost(postId, reason, description)`
Report harmful/inappropriate post

**Parameters:**
- `postId` (string)
- `reason` (string): 'spam', 'abuse', 'misinformation', 'other'
- `description` (string): What's wrong?

**Returns:** `{ success, report, error }`

**Example:**
```javascript
const result = await reportPost(
  '550e8400-e29b-41d4-a716-446655440000',
  'misinformation',
  'This health advice is dangerous'
);
```

---

## Habit Tracking

### `logHabit(logDate, steps, exerciseMinutes, sleepHours, waterGlasses, notes)`
Log daily habits

**Parameters:**
- `logDate` (string): YYYY-MM-DD format
- `steps` (number, optional)
- `exerciseMinutes` (number, optional)
- `sleepHours` (number, optional)
- `waterGlasses` (number, optional)
- `notes` (string, optional)

**Returns:** `{ success, habit, error }`

**Example:**
```javascript
const today = new Date().toISOString().split('T')[0]; // 2026-02-16

const result = await logHabit(
  today,
  10500,        // steps
  30,           // exercise minutes
  7.5,          // sleep hours
  8,            // water glasses
  'Felt great!'
);
```

---

### `getHabitsSummary(days)`
Get habit statistics for last N days

**Parameters:**
- `days` (number, optional): Last how many days (default: 30)

**Returns:**
```javascript
{
  success: true/false,
  summary: {
    totalLogs: 28,
    avgSteps: 8750,
    totalExerciseMinutes: 840,    // 30 min * 28 days
    avgSleepHours: 7.2,
  },
  logs: [
    {
      id: "uuid",
      user_id: "uuid",
      log_date: "2026-02-16",
      steps: 10500,
      exercise_minutes: 30,
      sleep_hours: 7.5,
      water_glasses: 8,
      notes: "Felt great!",
      created_at: "2026-02-16T21:30:00Z"
    },
    // ... more logs
  ],
  error: "..."
}
```

**Example:**
```javascript
const result = await getHabitsSummary(30);
if (result.success) {
  const { summary } = result;
  console.log(`Last 30 days:`);
  console.log(`  Avg steps: ${summary.avgSteps}`);
  console.log(`  Total exercise: ${summary.totalExerciseMinutes} min`);
  console.log(`  Avg sleep: ${summary.avgSleepHours} hrs`);
}
```

---

## User Profile

### `getUserProfile()`
Get your profile data

**Returns:**
```javascript
{
  success: true/false,
  profile: {
    id: "uuid",
    email: "john@example.com",
    full_name: "John Doe",
    date_of_birth: "1980-05-15",
    phone: "+66812345678",
    avatar_url: "https://...",
    created_at: "2025-12-01T...",
    updated_at: "2026-02-15T...",
  },
  error: "..."
}
```

**Example:**
```javascript
const result = await getUserProfile();
if (result.success) {
  console.log(`Hello ${result.profile.full_name}!`);
}
```

---

### `updateUserProfile(updates)`
Update your profile

**Parameters:**
- `updates` (object): Fields to update
  - `full_name`, `date_of_birth`, `phone`, `avatar_url`

**Returns:** `{ success, user, error }`

**Example:**
```javascript
const result = await updateUserProfile({
  full_name: 'John Smith',
  phone: '+66987654321'
});
```

---

### `exportUserData()`
Download all your data (GDPR compliance)

**Returns:**
```javascript
{
  success: true/false,
  data: {
    user: { ... },
    screenings: [ ... ],
    habits: [ ... ],
    posts: [ ... ],
    exportedAt: "2026-02-16T10:30:00Z"
  },
  error: "..."
}
```

**Example:**
```javascript
const result = await exportUserData();
if (result.success) {
  const json = JSON.stringify(result.data, null, 2);
  
  // Download as file
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-health-data.json';
  a.click();
}
```

---

### `deleteUserAccount()`
Permanently delete your account & all data

**Returns:** `{ success, error }`

⚠️ **WARNING: This cannot be undone!**

**Example:**
```javascript
if (confirm('Are you sure? This cannot be undone.')) {
  const result = await deleteUserAccount();
  if (result.success) {
    console.log('Your account has been deleted.');
    window.location.href = '/'; // Redirect to home
  }
}
```

---

## Subscription (Future)

```javascript
// Coming soon - integrate Stripe for paid features
// POST /billing/subscribe
// GET /billing/status
// POST /billing/cancel
```

---

## Events

Listen for auth state changes:

```javascript
document.addEventListener('userLoggedIn', (event) => {
  console.log('User logged in:', event.detail.email);
  // Update UI (show screening, hide login, etc.)
});

document.addEventListener('userLoggedOut', (event) => {
  console.log('User logged out');
  // Update UI (show login screen)
});
```

---

## Error Handling

All functions return `{ success, error }`. Always check:

```javascript
const result = await someFunction();
if (result.success) {
  // Do something with result.data
} else {
  console.error('Failed:', result.error);
  alert('Error: ' + result.error);
}
```

Common errors:
- `"Not authenticated"` → User needs to log in
- `"Duplicate key"` → Already exists
- `"Permission denied"` → RLS policy blocked it
- Network errors → Check Supabase status

---

## Best Practices

1. **Always check `result.success`** before using data
2. **Call `getCurrentUser()`** before any function that needs auth
3. **Use try-catch** in critical flows
4. **Log errors** for debugging
5. **Don't expose secrets** in frontend code (SUPABASE_ANON_KEY is fine, but never SERVICE_KEY)

---

## See Also

- [Supabase Documentation](https://supabase.com/docs)
- [BACKEND-SETUP.md](./BACKEND-SETUP.md) - Setup instructions
- [supabase-schema.sql](./supabase-schema.sql) - Database schema
