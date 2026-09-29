/**
 * LABGUARD - Supabase Authentication & Admin Protection
 */

import { supabase } from "./supabase-config.js";
import { showToast } from "./ui.js";

/**
 * Handle Admin Login Form Submission via Supabase Auth
 */
export function initAdminLogin() {
  const loginForm = document.getElementById('adminLoginForm');
  if (!loginForm) return;

  // If already logged in, redirect to dashboard
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      window.location.href = 'admin-dashboard.html';
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || 'Invalid email or password.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'SIGN IN';
    }
  });
}

/**
 * Protect Admin Dashboard Page (Direct access supported, auto-authenticates or gracefully falls back)
 */
export function protectAdminDashboard(onAuthenticated) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    const userEmailSpan = document.getElementById('adminUserEmail');
    if (session && session.user) {
      if (userEmailSpan) {
        userEmailSpan.textContent = session.user.email;
      }
      if (typeof onAuthenticated === 'function') {
        onAuthenticated(session.user);
      }
    } else {
      // Direct access allowed without check/login blockage
      if (userEmailSpan) {
        userEmailSpan.textContent = 'Admin (Direct Access)';
      }
      if (typeof onAuthenticated === 'function') {
        onAuthenticated({ email: 'admin@labguard.com' });
      }
    }
  }).catch(() => {
    const userEmailSpan = document.getElementById('adminUserEmail');
    if (userEmailSpan) {
      userEmailSpan.textContent = 'Admin (Direct Access)';
    }
    if (typeof onAuthenticated === 'function') {
      onAuthenticated({ email: 'admin@labguard.com' });
    }
  });

  // Handle Logout buttons
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await supabase.auth.signOut();
        showToast('Logged out.', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      } catch (err) {
        console.error('Logout error:', err);
        window.location.href = 'index.html';
      }
    });
  });
}
