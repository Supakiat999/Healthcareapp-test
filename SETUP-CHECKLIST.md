# Backend Setup Checklist & Visual Guide

Follow this checklist step-by-step. Each step takes ~5 minutes.

---

## 📋 Before You Start

Make sure you have:
- [ ] Supabase account (free, create at https://supabase.com)
- [ ] ccgp6.html file (already built)
- [ ] supabase-client.js file (already created)
- [ ] Code editor (VS Code recommended)
- [ ] Browser to test

---

## ✅ Step 1: Create Supabase Project (5 minutes)

### 1a. Go to Supabase Dashboard
- [ ] Open https://supabase.com/dashboard
- [ ] Click "New Project" (green button)

### 1b. Fill in Project Details
```
Project Name:     thai-ncd-screening
Password:         [pick something strong]
Database Password: [save this somewhere safe]
Region:           Singapore (Southeast Asia)
Pricing:          Free (✓ default)
```

- [ ] Fill all fields
- [ ] Click "Create New Project"
- [ ] Wait ~2 minutes (it will initialize)

### 1c. Verify Project Created
```
You should see:
✅ Project dashboard
✅ "Connected" status (green)
✅ URL and API keys ready
```

---

## 📋 Step 2: Get API Credentials (2 minutes)

### 2a. Navigate to Settings
```
Left sidebar:
  ↓
  Settings (⚙️ gear icon) 
  ↓
  Click
```

### 2b. Find API Section
```
Left sidebar under Settings:
  ↓
  API
  ↓
  Click
```

### 2c. Copy Credentials
You should see:

```
Project URL:
  https://xyzabc123.supabase.co

Anon public key:
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  (very long string)
```

- [ ] Copy **Project URL** → save to notepad
- [ ] Copy **Anon public key** → save to notepad

⚠️ Keep these safe! These are like your API credentials.

---

## 🗄️ Step 3: Create Database Schema (5 minutes)

### 3a. Open SQL Editor
```
Left sidebar:
  ↓
  SQL Editor (or <> icon)
  ↓
  Click "+ New Query"
```

### 3b. Paste Schema
- [ ] Open file: `supabase-schema.sql`
- [ ] Copy ALL content
- [ ] Paste into Supabase SQL editor

### 3c. Run SQL
```
In SQL editor:
  ↓
  Click "Run" (blue button top right)
  ↓
  Wait for completion
```

### 3d. Verify Tables Created
You should see:
```
✅ Query executed successfully

Left sidebar → "users" table
             → "screenings" table
             → "habit_logs" table
             → "posts" table
             → "comments" table
             → etc.
```

- [ ] Scroll left sidebar to verify 9 tables exist

---

## 🔑 Step 4: Update supabase-client.js (2 minutes)

### 4a. Open File
- [ ] Open `supabase-client.js` in your editor
- [ ] Find lines 4-5 (top of file):

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 4b. Paste Your Credentials
Replace:
- `YOUR_PROJECT.supabase.co` → your actual Project URL
- `YOUR_ANON_KEY` → your actual Anon public key

**Example:**
```javascript
const SUPABASE_URL = 'https://xyzabc123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJpc3MiOiJzdXBhYmFzZSI...';
```

- [ ] Save file

---

## 💻 Step 5: Update ccgp6.html (5 minutes)

### 5a. Open ccgp6.html
- [ ] Open your `ccgp6.html` file in editor

### 5b. Add Supabase Libraries
Find this line (around line 9):
```html
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
```

Add right after it:
```html
  <!-- Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-client.js"></script>
```

- [ ] Copy-paste these lines
- [ ] Save file

### 5c. Read INTEGRATION-GUIDE.md
- [ ] Open `INTEGRATION-GUIDE.md`
- [ ] Follow sections 2-7 to add:
  - Auth screen
  - Auth functions
  - Save screening
  - Logout button
  - Community posts
  - Initialization

These are **copy-paste ready code blocks**.

- [ ] Save ccgp6.html after each section

---

## 🧪 Step 6: Test Integration (10 minutes)

### 6a. Start Local Server
You need to serve files over HTTP (not file://).

**Option A: Using Python (easiest)**
```bash
# Navigate to your project folder in terminal
cd "c:\Users\ASUS\OneDrive\Desktop\ISE Y2\PSAT"

# Python 3.x
python -m http.server 8000

# You should see:
# Serving HTTP on 0.0.0.0 port 8000
```

**Option B: Using Node.js**
```bash
# Install http-server globally
npm install -g http-server

# Navigate to folder
cd "c:\Users\ASUS\OneDrive\Desktop\ISE Y2\PSAT"

# Serve
http-server -p 8000
```

### 6b. Open in Browser
- [ ] Go to http://localhost:8000/ccgp6.html
- [ ] You should see the **Auth Screen** (sign in / sign up)

### 6c. Test Sign Up
- [ ] Click "Create Account"
- [ ] Enter:
  - Full name: "Test User"
  - Email: "test@example.com"
  - Password: "testpass123"
- [ ] Click "Create Account"
- [ ] Should say "Account created! Please sign in."

### 6d. Verify Sign Up in Supabase
- [ ] Go back to Supabase dashboard
- [ ] Click **Authentication** (left sidebar)
- [ ] Click **Users** tab
- [ ] You should see "test@example.com" in the list

✅ **Auth is working!**

### 6e. Test Sign In
- [ ] In your browser, click "Sign In"
- [ ] Enter:
  - Email: "test@example.com"
  - Password: "testpass123"
- [ ] Click "Sign In"
- [ ] Should see "Welcome back! 👋" alert
- [ ] Should now see **Screening questionnaire**

✅ **Auth is working!**

### 6f. Test Screening Save
- [ ] Fill out minimal questionnaire:
  - Age: 40
  - Sex: Male
  - All other required fields
- [ ] Click "Evaluate"
- [ ] Should see results
- [ ] Check for green notification: "Results saved to your account"

### 6g. Verify in Supabase
- [ ] Go to Supabase dashboard
- [ ] Click **screenings** table
- [ ] You should see 1 row with:
  - user_id (matches auth user)
  - bmi, tds_percent, sbp, dbp
  - achievement_level, achievement_title

✅ **Screening save is working!**

### 6h. Test Community Post
- [ ] Click "Community" button
- [ ] Click "+ Post" button
- [ ] Type: "Test post! 🎉"
- [ ] Click "Post"
- [ ] Should see success alert

### 6i. Verify Post in Supabase
- [ ] Go to **posts** table in Supabase
- [ ] You should see your test post

✅ **Community is working!**

---

## ✅ Verification Checklist

All tests passed? Check these:

- [ ] Can create account
- [ ] Can see user in Supabase Auth
- [ ] Can sign in
- [ ] Can see screening form
- [ ] Can fill & evaluate screening
- [ ] See "Results saved" notification
- [ ] Screening appears in Supabase table
- [ ] Can post in community
- [ ] Post appears in Supabase posts table
- [ ] No console errors (check browser DevTools F12)

**If all ✅: You're ready to deploy! 🚀**

---

## 🐛 Troubleshooting

### Problem: "supabase is not defined"

**Solution**: Check that both scripts are in `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-client.js"></script>
```

Clear browser cache (Ctrl+Shift+Delete) and reload.

---

### Problem: Auth screen never goes away

**Cause**: `supabase-client.js` credentials are wrong

**Solution**:
1. Go to Supabase → Settings → API
2. Copy URL and key again
3. Paste into `supabase-client.js` lines 4-5
4. Save
5. Reload browser (Ctrl+Shift+R hard reload)

---

### Problem: "Failed to save screening"

**Cause**: User might not be authenticated OR RLS policy blocked it

**Solution**:
1. Check browser console (F12)
2. Copy the error message
3. Check that you're signed in
4. Try signing out and signing in again

---

### Problem: SignUp/SignIn buttons don't work

**Cause**: Missing `supabase-client.js` functions

**Solution**:
1. Verify `supabase-client.js` is in same folder as `ccgp6.html`
2. Check `ccgp6.html` has `<script src="supabase-client.js"></script>`
3. Check browser console for errors
4. Reload page

---

### Problem: Tables not showing in Supabase

**Cause**: SQL schema didn't run successfully

**Solution**:
1. Go to Supabase → SQL Editor
2. Click "+ New Query"
3. Paste `supabase-schema.sql` again
4. Check for red error message
5. Fix SQL syntax if needed (or paste again)
6. Click Run

---

## 🎉 You Did It!

Your backend is now:
✅ Secure (RLS + encryption)
✅ Scalable (Supabase infrastructure)
✅ GDPR-ready (audit logs, export, delete)
✅ Connected to ccgp6.html (auth + persist + community)

---

## 🚀 Next Steps

### Immediate (1 hour)
- [ ] Invite a friend to test sign up/login
- [ ] Fill out 2-3 screenings to verify data saves
- [ ] Check Supabase dashboard to see data accumulate

### This Week
- [ ] Add screening history view (list past results)
- [ ] Add simple habit logging
- [ ] Share app with beta testers

### Next Week
- [ ] Add BMI/BP trend charts
- [ ] Deploy to Vercel (automatic from GitHub)
- [ ] Set up email notifications

### Next Month
- [ ] Add Stripe subscription
- [ ] Premium features unlock
- [ ] Community moderation tools

---

## 📞 Need Help?

### For Errors
1. Check browser console (F12 → Console tab)
2. Copy full error message
3. Search in API-REFERENCE.md
4. Check BACKEND-SETUP.md "Troubleshooting"

### For Questions
- [ ] API-REFERENCE.md - function reference
- [ ] ARCHITECTURE.md - design decisions
- [ ] INTEGRATION-GUIDE.md - code patterns

### For Supabase Issues
- [ ] https://supabase.com/docs
- [ ] https://discord.supabase.io

---

## ✨ Celebrate!

You just built:
🎉 User authentication system
🎉 Secure health data storage
🎉 Community platform
🎉 Production-grade backend

That's **no small feat**. Well done! 🚀
