/**
 * LABGUARD - Unified Storage & Database Layer
 * Works on file:// protocol, localhost, and live servers
 */

const DB_NAME = 'LabguardWebsiteDB';
const DB_VERSION = 1;
const STORE_RELEASES = 'releases';
const STORE_FILES = 'files';

function getSupabase() {
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabase && typeof window.supabase.createClient === 'function' && window.SUPABASE_URL) {
    try {
      window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      return window.supabaseClient;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function openLocalDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_RELEASES)) {
        db.createObjectStore(STORE_RELEASES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

async function saveLocalRelease(releaseData, fileBlob) {
  // Always update localStorage as immediate fallback
  const localList = JSON.parse(localStorage.getItem('labguard_local_releases') || '[]');
  const existingIndex = localList.findIndex(r => r.id === releaseData.id);
  if (existingIndex >= 0) {
    localList[existingIndex] = releaseData;
  } else {
    localList.unshift(releaseData);
  }
  localStorage.setItem('labguard_local_releases', JSON.stringify(localList));

  const db = await openLocalDB();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_RELEASES, STORE_FILES], 'readwrite');
      tx.objectStore(STORE_RELEASES).put(releaseData);
      if (fileBlob) {
        tx.objectStore(STORE_FILES).put({ id: releaseData.id, blob: fileBlob, name: releaseData.file_name });
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    } catch (err) {
      resolve(true);
    }
  });
}

async function fetchAllReleases() {
  let supabaseReleases = [];
  let localReleases = [];

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseReleases = data;
      }
    } catch (e) {
      console.warn("Supabase fetch notice:", e);
    }
  }

  // Load from IndexedDB
  const db = await openLocalDB();
  if (db) {
    localReleases = await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_RELEASES, 'readonly');
        const req = tx.objectStore(STORE_RELEASES).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (err) {
        resolve([]);
      }
    });
  }

  // Also check localStorage
  const lsReleases = JSON.parse(localStorage.getItem('labguard_local_releases') || '[]');
  
  const map = new Map();
  lsReleases.forEach(r => map.set(r.id || r.version, r));
  localReleases.forEach(r => map.set(r.id || r.version, r));
  supabaseReleases.forEach(r => map.set(r.id || r.version, r));

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(b.release_date || b.created_at || 0) - new Date(a.release_date || a.created_at || 0));
  return merged;
}

async function getDownloadUrlForRelease(release) {
  if (release.download_url && release.download_url.startsWith('http') && !release.download_url.includes('undefined')) {
    return release.download_url;
  }

  const db = await openLocalDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_FILES, 'readonly');
        const req = tx.objectStore(STORE_FILES).get(release.id);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            const url = URL.createObjectURL(req.result.blob);
            resolve(url);
          } else {
            resolve(release.download_url || '#');
          }
        };
        req.onerror = () => resolve(release.download_url || '#');
      } catch (err) {
        resolve(release.download_url || '#');
      }
    });
  }

  return release.download_url || '#';
}

async function deleteRelease(id) {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('app_versions').delete().eq('id', id);
    } catch (e) {}
  }

  let local = JSON.parse(localStorage.getItem('labguard_local_releases') || '[]');
  local = local.filter(r => r.id !== id);
  localStorage.setItem('labguard_local_releases', JSON.stringify(local));

  const db = await openLocalDB();
  if (db) {
    try {
      const tx = db.transaction([STORE_RELEASES, STORE_FILES], 'readwrite');
      tx.objectStore(STORE_RELEASES).delete(id);
      tx.objectStore(STORE_FILES).delete(id);
    } catch (err) {}
  }
  return true;
}

async function updateReleaseStatus(id, isPublished) {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('app_versions').update({ is_published: isPublished }).eq('id', id);
    } catch (e) {}
  }

  let local = JSON.parse(localStorage.getItem('labguard_local_releases') || '[]');
  local = local.map(r => r.id === id ? { ...r, is_published: isPublished } : r);
  localStorage.setItem('labguard_local_releases', JSON.stringify(local));

  const db = await openLocalDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_RELEASES, 'readwrite');
      const store = tx.objectStore(STORE_RELEASES);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          const item = req.result;
          item.is_published = isPublished;
          store.put(item);
        }
      };
    } catch (err) {}
  }
  return true;
}

async function setLatestRelease(id) {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('app_versions').update({ is_latest: false }).neq('id', id);
      await sb.from('app_versions').update({ is_latest: true }).eq('id', id);
    } catch (e) {}
  }

  let local = JSON.parse(localStorage.getItem('labguard_local_releases') || '[]');
  local = local.map(r => ({ ...r, is_latest: r.id === id }));
  localStorage.setItem('labguard_local_releases', JSON.stringify(local));

  const db = await openLocalDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_RELEASES, 'readwrite');
      const store = tx.objectStore(STORE_RELEASES);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.forEach(item => {
          item.is_latest = (item.id === id);
          store.put(item);
        });
      };
    } catch (err) {}
  }
  return true;
}

window.LabguardDB = {
  saveLocalRelease,
  fetchAllReleases,
  getDownloadUrlForRelease,
  deleteRelease,
  updateReleaseStatus,
  setLatestRelease
};
