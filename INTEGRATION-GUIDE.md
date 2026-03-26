# Integration Guide: Adding Backend to ccgp6.html

This guide shows exactly where to add Supabase integration code to ccgp6.html.

---

## 1. Add Supabase Libraries to HTML Head

**File: ccgp6.html**

Find this line near `</head>` (around line 9):
```html
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
```

Add right after it:
```html
  <!-- Supabase Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Supabase API Functions -->
  <script src="supabase-client.js"></script>
```

---

## 2. Add Authentication UI Screen

**File: ccgp6.html**

Find the first `<section>` (around line 50):
```html
      <!-- Screen 1: COMPLETE SCREENING QUESTIONNAIRE (Single Screen) -->
      <section id="screenScreening" class="px-6 py-6 fade-in">
```

**Add this BEFORE it** (it will be hidden when user logs in):

```html
      <!-- Auth Screen -->
      <section id="screenAuth" class="px-6 py-6 fade-in">
        <div class="mb-6">
          <h2 class="font-serif text-2xl font-bold text-charm-dark text-center mt-10">Thai NCD Screening</h2>
          <p class="text-center text-xs text-gray-500 mt-2">Save your results & track progress</p>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 space-y-4">
          <!-- Sign In Tab -->
          <div id="signInTab" class="space-y-3">
            <h3 class="font-serif text-lg font-bold text-charm-dark">Sign In</h3>
            
            <input id="siEmail" type="email" class="w-full border border-stone-200 rounded-lg p-3 focus:border-charm-gold outline-none" placeholder="Email address" />
            <input id="siPassword" type="password" class="w-full border border-stone-200 rounded-lg p-3 focus:border-charm-gold outline-none" placeholder="Password (6+ chars)" />
            
            <button onclick="handleSignIn()" class="w-full bg-charm-blue text-white font-bold py-3 rounded-lg hover:opacity-90">
              Sign In
            </button>
            
            <p class="text-center text-xs text-gray-600">
              Don't have an account? 
              <button onclick="switchAuthTab('signup')" class="text-charm-blue font-bold">Create one</button>
            </p>
          </div>

          <!-- Sign Up Tab (hidden by default) -->
          <div id="signUpTab" class="space-y-3 hidden">
            <h3 class="font-serif text-lg font-bold text-charm-dark">Create Account</h3>
            
            <input id="suName" type="text" class="w-full border border-stone-200 rounded-lg p-3 focus:border-charm-gold outline-none" placeholder="Full name" />
            <input id="suEmail" type="email" class="w-full border border-stone-200 rounded-lg p-3 focus:border-charm-gold outline-none" placeholder="Email address" />
            <input id="suPassword" type="password" class="w-full border border-stone-200 rounded-lg p-3 focus:border-charm-gold outline-none" placeholder="Password (6+ chars)" />
            
            <button onclick="handleSignUp()" class="w-full bg-charm-blue text-white font-bold py-3 rounded-lg hover:opacity-90">
              Create Account
            </button>
            
            <p class="text-center text-xs text-gray-600">
              Already have an account? 
              <button onclick="switchAuthTab('signin')" class="text-charm-blue font-bold">Sign in</button>
            </p>
          </div>

          <div class="text-center">
            <button onclick="skipAuth()" class="text-xs text-gray-400 hover:text-gray-600">
              Skip (local mode only)
            </button>
          </div>
        </div>

        <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-[10px] text-amber-900">
            <strong>Privacy:</strong> Your health data is encrypted and stored securely. We never sell data.
          </p>
        </div>
      </section>
```

---

## 3. Add Authentication Functions

**File: ccgp6.html**

Find the end of the `<script>` section (around line 900, before `</script>`), add:

```javascript
    // ===== AUTHENTICATION =====
    
    function switchAuthTab(tab) {
      const signInTab = document.getElementById('signInTab');
      const signUpTab = document.getElementById('signUpTab');
      
      if (tab === 'signin') {
        signInTab.classList.remove('hidden');
        signUpTab.classList.add('hidden');
      } else {
        signInTab.classList.add('hidden');
        signUpTab.classList.remove('hidden');
      }
    }

    async function handleSignIn() {
      const email = document.getElementById('siEmail').value;
      const password = document.getElementById('siPassword').value;
      
      if (!email || !password) {
        alert('Please fill in all fields');
        return;
      }
      
      const result = await signInUser(email, password);
      if (result.success) {
        document.getElementById('screenAuth').classList.add('hidden');
        openScreen('screenScreening');
        alert('Welcome back! 👋');
      } else {
        alert('Sign in failed: ' + result.error);
      }
    }

    async function handleSignUp() {
      const name = document.getElementById('suName').value;
      const email = document.getElementById('suEmail').value;
      const password = document.getElementById('suPassword').value;
      
      if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
      }
      
      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      
      const result = await signUpUser(email, password, name);
      if (result.success) {
        alert('Account created! Please sign in.');
        switchAuthTab('signin');
      } else {
        alert('Sign up failed: ' + result.error);
      }
    }

    function skipAuth() {
      document.getElementById('screenAuth').classList.add('hidden');
      openScreen('screenScreening');
      console.log('Running in local mode (results won\'t be saved)');
    }

    // Check if user is already logged in
    async function initAuth() {
      const user = await getCurrentUser();
      if (user) {
        // User is logged in, skip auth screen
        document.getElementById('screenAuth').classList.add('hidden');
        openScreen('screenScreening');
      } else {
        // Show auth screen
        openScreen('screenAuth');
      }
    }

    // Call on page load (add to the very end of the script)
    initAuth();
```

---

## 4. Save Screening Results to Backend

**File: ccgp6.html**

Find this section (around line 890):
```javascript
    $('btnEvaluate').addEventListener('click', () => {
      const inputs = readAllInputs();
      if (!inputs.sbp || !inputs.dbp) {
        alert('Please enter blood pressure readings.');
        return;
      }
      if (!inputs.pa || inputs.dScore === null || inputs.stScore === null) {
        alert('Please answer all questionnaire sections.');
        return;
      }
      renderResults(inputs);
      openScreen('screenResults');
    });
```

**Replace it with:**
```javascript
    $('btnEvaluate').addEventListener('click', async () => {
      const inputs = readAllInputs();
      if (!inputs.sbp || !inputs.dbp) {
        alert('Please enter blood pressure readings.');
        return;
      }
      if (!inputs.pa || inputs.dScore === null || inputs.stScore === null) {
        alert('Please answer all questionnaire sections.');
        return;
      }
      
      renderResults(inputs);
      openScreen('screenResults');
      
      // Try to save to backend (if logged in)
      const user = await getCurrentUser();
      if (user) {
        const tds = calcTDS(inputs.age, inputs.sex, inputs.bmi, inputs.waist, inputs.sbp, inputs.dbp, inputs.fh_dm === 'none' ? 'no' : 'yes');
        const bp = calcBPCategory(inputs.sbp, inputs.dbp);
        const achievement = getAchievementLevel(tds, inputs.dScore, inputs.stScore, inputs.pa);
        
        const saveResult = await saveScreening(
          inputs,
          {
            bmi: inputs.bmi,
            tdsPct: tds ? tds.pct : null,
            sbp: inputs.sbp,
            dbp: inputs.dbp,
            dScore: inputs.dScore,
            stScore: inputs.stScore,
            tdsRiskLevel: tds && tds.pct >= 20 ? 'very_high' : tds && tds.pct >= 10 ? 'high' : tds && tds.pct >= 5 ? 'moderate' : 'low',
            bpCategory: bp.label,
            dietCategory: inputs.dScore >= 7 ? 'good' : inputs.dScore >= 4 ? 'fair' : 'poor',
            stressLevel: inputs.stScore >= 8 ? 'high' : inputs.stScore >= 5 ? 'moderate' : 'low',
          },
          achievement
        );
        
        if (saveResult.success) {
          // Add visual feedback
          const resultsContainer = document.getElementById('resultsContainer');
          resultsContainer.insertAdjacentHTML('beforeend', `
            <div class="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p class="text-xs text-emerald-800">✅ Results saved to your account</p>
            </div>
          `);
        }
      }
    });
```

---

## 5. Add Logout Button to Results Screen

**File: ccgp6.html**

Find the Results screen section (around line 480):
```html
        <button id="btnEditScreening" class="w-full mt-4 bg-white border border-stone-200 text-charm-blue font-bold py-3 rounded-xl shadow-soft active:scale-95 transition">
          Edit Answers
        </button>
      </section>
```

**Add after the Edit button:**
```html
        <button id="btnLogout" onclick="handleLogout()" class="w-full mt-2 bg-stone-100 border border-stone-300 text-charm-dark font-bold py-3 rounded-xl hover:bg-stone-200 transition active:scale-95">
          <i class="fas fa-sign-out-alt mr-2"></i> Sign Out
        </button>
      </section>
```

**Add this function to your script:**
```javascript
    async function handleLogout() {
      if (confirm('Sign out?')) {
        const result = await signOutUser();
        if (result.success) {
          document.getElementById('screenAuth').classList.remove('hidden');
          openScreen('screenAuth');
        }
      }
    }
```

---

## 6. Update Community Posts to Use Backend

**File: ccgp6.html**

Find the `addNewPost()` function (around line 930), replace it with:

```javascript
    async function addNewPost() {
      const text = document.getElementById('postText').value.trim();
      if (!text) {
        alert('Please type something to share!');
        return;
      }
      
      const user = await getCurrentUser();
      if (!user) {
        alert('Please sign in to post');
        return;
      }
      
      // Save to backend
      const result = await createPost(text, 'general', false);
      if (result.success) {
        document.getElementById('postText').value = '';
        closeNewPostModal();
        alert('โพสต์ของคุณถูกแชร์แล้ว! 🎉');
        
        // Refresh feed
        await loadCommunityPosts();
      } else {
        alert('Failed to post: ' + result.error);
      }
    }

    // Load posts from backend when community opens
    async function loadCommunityPosts() {
      const result = await getPosts('general', 50);
      if (result.success && result.posts.length > 0) {
        const html = result.posts.map(post => `
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-charm-blue rounded-full flex items-center justify-center text-white text-xs font-bold">${post.users.full_name.charAt(0)}</div>
                <div>
                  <p class="text-[10px] font-bold text-charm-dark">${post.users.full_name}</p>
                  <p class="text-[9px] text-gray-500">${new Date(post.created_at).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <i class="fas fa-heart text-charm-gold"></i>
            </div>
            <p class="text-sm text-charm-dark leading-relaxed">${post.content}</p>
            <div class="flex gap-3 mt-3 text-xs text-gray-500">
              <span><i class="fas fa-heart"></i> ${post.likes_count} ถูกใจ</span>
              <span><i class="fas fa-comment"></i> ${post.comments_count} ความเห็น</span>
            </div>
          </div>
        `).join('');
        
        document.getElementById('communityFeed').innerHTML = html;
      }
    }

    // Load posts when community button is clicked
    document.querySelector('[onclick="openScreen(\'screenCommunity\')"]')?.addEventListener('click', loadCommunityPosts);
```

---

## 7. Initialize on Page Load

**File: ccgp6.html**

Find the bottom of the script (very end):
```javascript
    openScreen('screenScreening');
    setBMIUI(null);
    updateFollowups();
  </script>
```

**Change to:**
```javascript
    // Initialize auth first
    // (don't show screening until user logs in or skips)
    // initAuth() is already called above
    
    setBMIUI(null);
    updateFollowups();
  </script>
```

---

## 8. Update supabase-client.js with Your Credentials

**File: supabase-client.js**

Find these lines at the top:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Replace with your actual Supabase credentials from [supabase.com](https://supabase.com):
```javascript
const SUPABASE_URL = 'https://xyzabc123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Testing Checklist

- [ ] Can you see the auth screen when page loads?
- [ ] Can you create a new account?
- [ ] Can you sign in?
- [ ] Can you fill out questionnaire normally?
- [ ] When you click "Evaluate", does it show "Results saved to your account"?
- [ ] Does the post button work & show success?
- [ ] Check Supabase dashboard → **screenings** table → see your records?
- [ ] Check Supabase → **posts** table → see your posts?

---

## Troubleshooting

**Q: "Uncaught TypeError: supabase is not defined"**
→ Make sure both scripts are loaded:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-client.js"></script>
```

**Q: "Not authenticated" when saving**
→ User needs to sign in first. Check `getCurrentUser()` returns a user.

**Q: Nothing saves to database**
→ Check browser console for errors. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct.

**Q: Posts not loading**
→ Make sure posts exist in Supabase. Try `await getPosts()` in browser console.

---

## Next Steps

Once basic integration works:

1. **Add screening history view** (show past results as timeline)
2. **Add habit tracking** (daily exercise/sleep logs)
3. **Add charts** (BMI/BP trends over time)
4. **Add payment** (Stripe integration for premium)
5. **Deploy** (Vercel/Netlify for frontend)

Good luck! 🚀
