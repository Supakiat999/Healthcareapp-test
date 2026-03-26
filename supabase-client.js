// Supabase Client Setup for Thai NCD Screening App
// Include this BEFORE your ccgp6.html code

// Initialize from https://supabase.com/dashboard
// You'll get these from your Supabase project settings
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Load Supabase client
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========== AUTH FUNCTIONS ===========

async function signUpUser(email, password, fullName) {
  try {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    
    if (signUpError) throw signUpError;
    
    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: email,
      full_name: fullName,
    });
    
    if (profileError) throw profileError;
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign up error:', error.message);
    return { success: false, error: error.message };
  }
}

async function signInUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign in error:', error.message);
    return { success: false, error: error.message };
  }
}

async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error.message);
    return { success: false, error: error.message };
  }
}

async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get user error:', error.message);
    return null;
  }
}

// =========== SCREENING FUNCTIONS ===========

async function saveScreening(answersData, computedScores, achievement) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('screenings').insert({
      user_id: user.id,
      answers: answersData,
      
      bmi: computedScores.bmi || null,
      tds_percent: computedScores.tdsPct || null,
      sbp: computedScores.sbp || null,
      dbp: computedScores.dbp || null,
      diet_score: computedScores.dScore || null,
      stress_score: computedScores.stScore || null,
      
      tds_risk_level: computedScores.tdsRiskLevel || null,
      bp_category: computedScores.bpCategory || null,
      diet_category: computedScores.dietCategory || null,
      stress_level: computedScores.stressLevel || null,
      
      achievement_level: achievement.level || 1,
      achievement_title: achievement.title || 'Health Starter',
      xp_earned: achievement.xp || 0,
    });
    
    if (error) throw error;
    
    // Log to audit trail
    await logAuditAction(user.id, 'screening_created', 'screenings', data[0]?.id);
    
    return { success: true, screening: data[0] };
  } catch (error) {
    console.error('Save screening error:', error.message);
    return { success: false, error: error.message };
  }
}

async function getScreeningHistory(limit = 20) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { success: true, screenings: data };
  } catch (error) {
    console.error('Get history error:', error.message);
    return { success: false, error: error.message };
  }
}

async function getScreeningStats() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('screenings')
      .select('bmi, tds_percent, sbp, dbp, diet_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate trends
    const stats = {
      totalScreenings: data.length,
      latestBMI: data[0]?.bmi || null,
      latestTDS: data[0]?.tds_percent || null,
      averageBMI: data.length > 0 ? (data.reduce((sum, s) => sum + (s.bmi || 0), 0) / data.length).toFixed(1) : null,
      averageTDS: data.length > 0 ? (data.reduce((sum, s) => sum + (s.tds_percent || 0), 0) / data.length).toFixed(1) : null,
      bmiTrend: data.length > 1 ? (data[0].bmi - data[data.length - 1].bmi).toFixed(1) : null,
      tdsTrend: data.length > 1 ? (data[0].tds_percent - data[data.length - 1].tds_percent).toFixed(1) : null,
    };
    
    return { success: true, stats };
  } catch (error) {
    console.error('Get stats error:', error.message);
    return { success: false, error: error.message };
  }
}

// =========== COMMUNITY FUNCTIONS ===========

async function createPost(content, topic = 'general', isAnonymous = false) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id,
      content,
      topic,
      is_anonymous: isAnonymous,
    });
    
    if (error) throw error;
    
    await logAuditAction(user.id, 'post_created', 'posts', data[0]?.id);
    
    return { success: true, post: data[0] };
  } catch (error) {
    console.error('Create post error:', error.message);
    return { success: false, error: error.message };
  }
}

async function getPosts(topic = null, limit = 20) {
  try {
    let query = supabase
      .from('posts')
      .select('id, content, topic, likes_count, comments_count, created_at, users(full_name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (topic) {
      query = query.eq('topic', topic);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { success: true, posts: data };
  } catch (error) {
    console.error('Get posts error:', error.message);
    return { success: false, error: error.message };
  }
}

async function createComment(postId, content) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content,
    });
    
    if (error) throw error;
    
    // Increment comment count
    await supabase
      .from('posts')
      .update({ comments_count: supabase.raw('comments_count + 1') })
      .eq('id', postId);
    
    return { success: true, comment: data[0] };
  } catch (error) {
    console.error('Create comment error:', error.message);
    return { success: false, error: error.message };
  }
}

async function likePost(postId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Add like
    const { error: likeError } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });
    
    if (likeError && !likeError.message.includes('duplicate')) throw likeError;
    
    // Increment like count
    const { error: updateError } = await supabase
      .from('posts')
      .update({ likes_count: supabase.raw('likes_count + 1') })
      .eq('id', postId);
    
    if (updateError) throw updateError;
    
    return { success: true };
  } catch (error) {
    console.error('Like post error:', error.message);
    return { success: false, error: error.message };
  }
}

async function reportPost(postId, reason, description) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('reports').insert({
      reported_post_id: postId,
      reporter_user_id: user.id,
      reason,
      description,
    });
    
    if (error) throw error;
    
    return { success: true, report: data[0] };
  } catch (error) {
    console.error('Report post error:', error.message);
    return { success: false, error: error.message };
  }
}

// =========== HABIT TRACKING ===========

async function logHabit(logDate, steps = null, exerciseMinutes = null, sleepHours = null, waterGlasses = null, notes = null) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('habit_logs').upsert({
      user_id: user.id,
      log_date: logDate,
      steps,
      exercise_minutes: exerciseMinutes,
      sleep_hours: sleepHours,
      water_glasses: waterGlasses,
      notes,
    }, { onConflict: 'user_id,log_date' });
    
    if (error) throw error;
    
    return { success: true, habit: data[0] };
  } catch (error) {
    console.error('Log habit error:', error.message);
    return { success: false, error: error.message };
  }
}

async function getHabitsSummary(days = 30) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', startDate.toISOString().split('T')[0])
      .order('log_date', { ascending: false });
    
    if (error) throw error;
    
    // Calculate summary
    const summary = {
      totalLogs: data.length,
      avgSteps: data.filter(d => d.steps).length > 0 
        ? Math.round(data.filter(d => d.steps).reduce((sum, d) => sum + d.steps, 0) / data.filter(d => d.steps).length)
        : 0,
      totalExerciseMinutes: data.reduce((sum, d) => sum + (d.exercise_minutes || 0), 0),
      avgSleepHours: data.filter(d => d.sleep_hours).length > 0
        ? (data.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / data.filter(d => d.sleep_hours).length).toFixed(1)
        : 0,
    };
    
    return { success: true, summary, logs: data };
  } catch (error) {
    console.error('Get habits error:', error.message);
    return { success: false, error: error.message };
  }
}

// =========== USER PROFILE ===========

async function updateUserProfile(updates) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);
    
    if (error) throw error;
    
    return { success: true, user: data[0] };
  } catch (error) {
    console.error('Update profile error:', error.message);
    return { success: false, error: error.message };
  }
}

async function getUserProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    return { success: true, profile: data };
  } catch (error) {
    console.error('Get profile error:', error.message);
    return { success: false, error: error.message };
  }
}

async function deleteUserAccount() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Log deletion for compliance
    await logAuditAction(user.id, 'account_deleted', 'users', user.id);
    
    // Delete user profile (auth.users will cascade)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);
    
    if (error) throw error;
    
    // Sign out
    await signOutUser();
    
    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error.message);
    return { success: false, error: error.message };
  }
}

async function exportUserData() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Get all user data
    const [screenings, habits, posts] = await Promise.all([
      supabase.from('screenings').select('*').eq('user_id', user.id),
      supabase.from('habit_logs').select('*').eq('user_id', user.id),
      supabase.from('posts').select('*').eq('user_id', user.id),
    ]);
    
    const exportData = {
      user: user,
      screenings: screenings.data || [],
      habits: habits.data || [],
      posts: posts.data || [],
      exportedAt: new Date().toISOString(),
    };
    
    // Log for compliance
    await logAuditAction(user.id, 'data_exported', 'users', user.id);
    
    return { success: true, data: exportData };
  } catch (error) {
    console.error('Export data error:', error.message);
    return { success: false, error: error.message };
  }
}

// =========== AUDIT LOGGING ===========

async function logAuditAction(userId, action, resourceType, resourceId) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
}

// =========== UTILITY ===========

function isUserLoggedIn() {
  return supabase.auth.getSession().then(({ data }) => !!data.session);
}

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  // Update UI based on auth state
  if (event === 'SIGNED_IN') {
    document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: session.user }));
  } else if (event === 'SIGNED_OUT') {
    document.dispatchEvent(new CustomEvent('userLoggedOut'));
  }
});
