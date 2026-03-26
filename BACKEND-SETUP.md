# Supabase Backend Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign in with GitHub/email
3. Create new project:
   - **Name**: `thai-ncd-screening`
   - **Password**: (save securely)
   - **Region**: Singapore (closest to Thailand)
   - **Pricing**: Free tier is fine for MVP

4. Wait for project to initialize (~2 min)

## Step 2: Get Credentials

In your Supabase dashboard:

1. Click **Settings** (gear icon bottom left)
2. Click **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`

Example:
```
SUPABASE_URL = https://xyzabc123.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Create Database Schema

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **+ New Query**
3. Copy entire `supabase-schema.sql` file → paste into editor
4. Click **Run** (it will execute all at once)
5. Check for any errors at bottom

✅ If successful, you should see 9 new tables:
- users, screenings, habit_logs, posts, comments, post_likes, reports, subscriptions, audit_logs

## Step 4: Enable Authentication

1. Click **Authentication** (left sidebar)
2. Click **Providers**
3. "Email" should already be ON
4. (Optional) Enable Google/Apple sign-in later

## Step 5: Configure ccgp6.html

1. Open `ccgp6.html` in your editor
2. Find the `<head>` section
3. Add this before `</head>`:

```html
<!-- Supabase Client Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Your Supabase Config + API Functions -->
<script src="supabase-client.js"></script>
```

4. Update `supabase-client.js`:
   - Replace `YOUR_PROJECT` with your project name
   - Replace `YOUR_ANON_KEY` with your anon key
   
Example:
```javascript
const SUPABASE_URL = 'https://xyzabc123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

5. Save both files

## Step 6: Integration Points in ccgp6.html

### A. On Results Screen (after screening):

Add this to save screening results:

```javascript
// In the evaluation button handler, after renderResults():

const screeningData = readAllInputs();
const result = await saveScreening(
  screeningData,
  {
    bmi: calcBMI(screeningData.weight, screeningData.height),
    tdsPct: tdsPct,
    sbp: screeningData.sbp,
    dbp: screeningData.dbp,
    dScore: screeningData.dScore,
    stScore: screeningData.stScore,
    tdsRiskLevel: identifyRiskLevel(tdsPct),
    bpCategory: bp.label,
    dietCategory: getDietCategory(screeningData.dScore),
    stressLevel: getStressLevel(screeningData.stScore),
  },
  achievement
);

if (result.success) {
  console.log('Screening saved:', result.screening);
  // Show confirmation to user
} else {
  console.error('Failed to save:', result.error);
  alert('Could not save results. Check console.');
}
```

### B. On Page Load (show history):

```javascript
// After page loads, fetch user's screening history:

async function loadScreeningHistory() {
  const user = await getCurrentUser();
  if (!user) return; // Not logged in
  
  const result = await getScreeningHistory(10);
  if (result.success) {
    console.log('Your screenings:', result.screenings);
    // Render as chart/timeline
  }
}

loadScreeningHistory();
```

### C. Community Posts (already has local demo):

Replace the demo posts with real ones:

```javascript
async function loadCommunityPosts() {
  const result = await getPosts('general', 20);
  if (result.success) {
    // Render result.posts to #communityFeed
    renderPostsToUI(result.posts);
  }
}

// When user clicks "+ Post":
async function handleNewPost() {
  const text = $('#postText').value;
  if (!text) return;
  
  const result = await createPost(text, 'general');
  if (result.success) {
    $('#postText').value = '';
    closeNewPostModal();
    loadCommunityPosts(); // Refresh feed
    alert('โพสต์ของคุณถูกแชร์แล้ว! 🎉');
  }
}
```

### D. Add Login UI (before screening):

This is where users authenticate. Add to top of ccgp6.html:

```html
<!-- Login Modal (add to top section BEFORE phone frame) -->
<div id="authScreen" class="...">
  <h2>Sign in to Save Results</h2>
  <input id="authEmail" type="email" placeholder="Email" />
  <input id="authPassword" type="password" placeholder="Password" />
  
  <button onclick="handleSignIn()">Sign In</button>
  <button onclick="showSignUp()">Create Account</button>
</div>

<script>
async function handleSignIn() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  
  const result = await signInUser(email, password);
  if (result.success) {
    document.getElementById('authScreen').style.display = 'none';
    // Show screening UI
  } else {
    alert('Sign in failed: ' + result.error);
  }
}
</script>
```

## Step 7: Test It

1. **Test Sign Up**:
   - Go to localhost → click sign up
   - Enter email: `test@example.com`
   - Check Supabase → **Auth Users** tab → should see it

2. **Test Screening Save**:
   - Fill out questionnaire → Evaluate
   - Check results saved → go to Supabase → **screenings** table → should see new row

3. **Test Community**:
   - Click "+ Post" → type message
   - Check **posts** table in Supabase

## Troubleshooting

### "Error: anon key is invalid"
→ Check `SUPABASE_ANON_KEY` is correct (no typos)

### "POST blocked by CORS"
→ Go to Supabase **Settings → API → CORS** → add your domain

### "User not authenticated"
→ Make sure sign-in happens before screening save

### Tables not showing
→ Go to SQL Editor → paste schema again → check for error messages

## Environment Variables (Production)

When deploying, use `.env` instead of hardcoding:

```bash
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Then in `supabase-client.js`:
```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Next Steps

After basic integration works:

1. **Add trends charts** (BMI/BP over time)
2. **Habit tracking** (daily exercise/sleep logs)
3. **Payment integration** (Stripe → premium features)
4. **Mobile app** (React Native / Expo)
5. **Analytics** (Supabase has built-in dashboards)
