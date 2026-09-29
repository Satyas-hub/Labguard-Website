/**
 * LABGUARD - Supabase Configuration (Universal compatibility)
 */

const SUPABASE_URL = 'https://ylyljdgunqkqgxdajbqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseWxqZGd1bnFrcWd4ZGFqYnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDc4MjEsImV4cCI6MjEwNTU4MzgyMX0.DkP_ZB0-_N0K8HkJtNtgeKV4xZfVayEmi4CEIDznQck';

let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("Supabase init notice:", e);
  }
}

window.supabaseClient = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
