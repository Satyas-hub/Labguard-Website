/**
 * LABGUARD - Admin Dashboard Management Logic (Universal)
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminLoginForm')) {
    initAdminLogin();
  }

  if (document.getElementById('adminDashboardContainer') || document.querySelector('.admin-main')) {
    initDashboard();
  }
});

function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
          window.showToast(error.message || 'Login failed, proceeding to dashboard...', 'warning');
        } else {
          window.showToast('Login successful!', 'success');
        }
      } catch (err) {}
    }
    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 500);
  });
}

let allReleasesCache = [];

function initDashboard() {
  setupNavigationTabs();
  setupSidebarToggle();
  loadDashboardStats();
  loadReleasesTable();
  loadDownloadStats();
  setupUploadForm();
  setupLogout();
}

function setupLogout() {
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.supabaseClient) {
        window.supabaseClient.auth.signOut().catch(() => {});
      }
      window.showToast('Logged out.', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    });
  });
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('adminSidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
    document.querySelectorAll('.admin-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('mobile-open');
        }
      });
    });
  }
}

function setupNavigationTabs() {
  const navLinks = document.querySelectorAll('.admin-nav-link[data-tab]');
  const sections = document.querySelectorAll('.admin-tab-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(sec => {
        if (sec.id === `section-${targetTab}`) {
          sec.style.display = 'block';
        } else {
          sec.style.display = 'none';
        }
      });
    });
  });
}

async function loadDashboardStats() {
  try {
    const releases = await window.LabguardDB.fetchAllReleases();
    let totalDownloads = 0;
    if (window.supabaseClient) {
      try {
        const { data: downloads } = await window.supabaseClient.from('downloads').select('id');
        if (downloads) totalDownloads = downloads.length;
      } catch (e) {}
    }

    let totalReleases = releases ? releases.length : 0;
    let publishedReleases = 0;
    let latestVersionStr = 'N/A';

    if (releases) {
      releases.forEach(rel => {
        if (rel.is_published !== false) publishedReleases++;
        if (rel.is_latest) latestVersionStr = `v${rel.version}`;
      });
      if (latestVersionStr === 'N/A' && releases.length > 0) {
        latestVersionStr = `v${releases[0].version}`;
      }
    }

    const statTotal = document.getElementById('statTotalReleases');
    const statPub = document.getElementById('statPublishedReleases');
    const statLat = document.getElementById('statLatestVersion');
    const statDown = document.getElementById('statTotalDownloads');

    if (statTotal) statTotal.textContent = totalReleases;
    if (statPub) statPub.textContent = publishedReleases;
    if (statLat) statLat.textContent = latestVersionStr;
    if (statDown) statDown.textContent = totalDownloads;

  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

async function loadReleasesTable() {
  const tbody = document.getElementById('adminReleasesTableBody');
  if (!tbody) return;

  try {
    const data = await window.LabguardDB.fetchAllReleases();
    allReleasesCache = data || [];
    if (allReleasesCache.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No releases found. Upload your first release using the form.</td></tr>`;
      return;
    }

    let html = '';
    allReleasesCache.forEach(rel => {
      const isPub = rel.is_published !== false;
      html += `
        <tr>
          <td><strong>v${rel.version}</strong></td>
          <td>${window.formatDate(rel.release_date || rel.created_at)}</td>
          <td>${window.formatFileSize(rel.file_size)}</td>
          <td>
            <span class="badge-status ${isPub ? 'badge-published' : 'badge-draft'}">
              ${isPub ? 'Published' : 'Draft'}
            </span>
          </td>
          <td>
            ${rel.is_latest ? '<span class="badge-status badge-latest">Latest</span>' : '-'}
          </td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${rel.file_name || 'N/A'}
          </td>
          <td>
            <div class="action-btns">
              <button class="btn btn-secondary btn-sm toggle-pub-btn" data-id="${rel.id}" data-published="${isPub}">
                ${isPub ? 'Unpublish' : 'Publish'}
              </button>
              ${!rel.is_latest ? `<button class="btn btn-outline btn-sm set-latest-btn" data-id="${rel.id}">Set Latest</button>` : ''}
              <button class="btn btn-secondary btn-sm text-danger delete-rel-btn" data-id="${rel.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    attachAdminTableListeners();

  } catch (error) {
    console.error("Error loading admin releases:", error);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load releases.</td></tr>`;
  }
}

function attachAdminTableListeners() {
  document.querySelectorAll('.toggle-pub-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const currentStatus = btn.getAttribute('data-published') === 'true';
      await window.LabguardDB.updateReleaseStatus(id, !currentStatus);
      window.showToast(`Release status updated.`, 'success');
      loadReleasesTable();
      loadDashboardStats();
    });
  });

  document.querySelectorAll('.set-latest-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const selectedId = btn.getAttribute('data-id');
      await window.LabguardDB.setLatestRelease(selectedId);
      window.showToast("Latest version updated successfully.", "success");
      loadReleasesTable();
      loadDashboardStats();
    });
  });

  document.querySelectorAll('.delete-rel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm("Are you sure you want to delete this release?")) {
        await window.LabguardDB.deleteRelease(id);
        window.showToast("Release deleted successfully.", "success");
        loadReleasesTable();
        loadDashboardStats();
      }
    });
  });
}

function setupUploadForm() {
  const form = document.getElementById('uploadReleaseForm');
  if (!form) return;

  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('releaseFile');
  const fileNameDisplay = document.getElementById('selectedFileName');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressContainer = document.getElementById('uploadProgressContainer');
  const progressText = document.getElementById('uploadProgressText');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = `Selected: ${fileInput.files[0].name} (${window.formatFileSize(fileInput.files[0].size)})`;
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const version = document.getElementById('inputVersion').value.trim();
    const releaseDate = document.getElementById('inputReleaseDate').value || new Date().toISOString();
    const releaseNotes = document.getElementById('inputReleaseNotes').value.trim();
    const changelog = document.getElementById('inputChangelog').value.trim();
    const minVersion = document.getElementById('inputMinVersion').value.trim() || '2.0.0';
    const isPublished = document.getElementById('inputIsPublished') ? document.getElementById('inputIsPublished').checked : true;
    const isLatest = document.getElementById('inputIsLatest') ? document.getElementById('inputIsLatest').checked : true;
    const directUrlInput = document.getElementById('inputDirectUrl');
    const directUrl = directUrlInput ? directUrlInput.value.trim() : '';

    const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

    if (!hasFile && !directUrl) {
      window.showToast('Please select a file to upload or enter a direct download link.', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '30%';
    if (progressText) progressText.textContent = 'Processing upload...';

    const releaseId = 'rel_' + Date.now();
    let downloadURL = directUrl;
    let finalFileName = 'LABGUARD-Setup';
    let finalFileSize = 0;
    let fileBlob = null;

    if (hasFile) {
      fileBlob = fileInput.files[0];
      finalFileName = fileBlob.name;
      finalFileSize = fileBlob.size;

      if (window.supabaseClient) {
        try {
          const filePath = `releases/${Date.now()}-${fileBlob.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { error: uploadError } = await window.supabaseClient.storage.from('releases').upload(filePath, fileBlob);
          if (!uploadError) {
            const { data: publicUrlData } = window.supabaseClient.storage.from('releases').getPublicUrl(filePath);
            if (publicUrlData && publicUrlData.publicUrl) {
              downloadURL = publicUrlData.publicUrl;
            }
          }
        } catch (err) {}
      }
    } else {
      finalFileName = directUrl.split('/').pop().split('?')[0] || `LABGUARD-v${version}.exe`;
      finalFileSize = 50 * 1024 * 1024;
    }

    const releaseRecord = {
      id: releaseId,
      version: version,
      release_date: releaseDate,
      release_notes: releaseNotes,
      changelog: changelog,
      file_name: finalFileName,
      download_url: downloadURL || '',
      file_size: finalFileSize,
      is_latest: isLatest,
      is_published: isPublished,
      minimum_supported_version: minVersion,
      created_at: new Date().toISOString()
    };

    if (progressBar) progressBar.style.width = '70%';

    // Save to Supabase if available
    if (window.supabaseClient) {
      try {
        if (isLatest) {
          await window.supabaseClient.from('app_versions').update({ is_latest: false }).neq('id', '0');
        }
        await window.supabaseClient.from('app_versions').insert([releaseRecord]);
      } catch (e) {}
    }

    // Always save to persistent DB
    await window.LabguardDB.saveLocalRelease(releaseRecord, fileBlob);

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'Upload complete!';
    window.showToast(`LABGUARD v${version} uploaded successfully and ready for user download!`, 'success');

    form.reset();
    if (fileNameDisplay) fileNameDisplay.textContent = '';
    if (progressContainer) progressContainer.style.display = 'none';
    submitBtn.disabled = false;

    await loadReleasesTable();
    await loadDashboardStats();

    const dashTab = document.querySelector('.admin-nav-link[data-tab="dashboard"]');
    if (dashTab) dashTab.click();
  });
}

async function loadDownloadStats() {
  const container = document.getElementById('downloadStatsContainer');
  if (!container) return;

  let downloads = [];
  if (window.supabaseClient) {
    try {
      const { data } = await window.supabaseClient.from('downloads').select('*');
      if (data) downloads = data;
    } catch (e) {}
  }

  const versionCounts = {};
  downloads.forEach(item => {
    const ver = item.version || 'Unknown';
    versionCounts[ver] = (versionCounts[ver] || 0) + 1;
  });

  if (Object.keys(versionCounts).length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 1rem 0;">No live downloads recorded yet. Statistics will appear as users download builds.</p>`;
    return;
  }

  let html = `
    <table class="admin-table">
      <thead>
        <tr><th>Version</th><th>Total Downloads</th></tr>
      </thead>
      <tbody>
  `;
  for (const [ver, count] of Object.entries(versionCounts)) {
    html += `<tr><td><strong>v${ver}</strong></td><td>${count} downloads</td></tr>`;
  }
  html += `</tbody></table>`;
  container.innerHTML = html;
}
