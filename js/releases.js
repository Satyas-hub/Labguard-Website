/**
 * LABGUARD - Releases Fetcher & UI Renderer for Public Pages
 */

async function loadLatestReleaseOnHome() {
  const container = document.getElementById('latestReleaseContainer');
  if (!container) return;

  try {
    const data = await window.LabguardDB.fetchAllReleases();

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No releases available yet</h3>
          <p>Please upload a release package from the Admin Portal.</p>
        </div>
      `;
      return;
    }

    let latestRel = data.find(r => r.is_latest) || data[0];
    const directDownloadHref = await window.LabguardDB.getDownloadUrlForRelease(latestRel);
    const hasValidUrl = directDownloadHref && directDownloadHref.startsWith('http');

    const changelogHtml = latestRel.changelog
      ? latestRel.changelog.split('\n').map(item => `<li>${item.trim()}</li>`).join('')
      : '<li>Standard system security & performance updates.</li>';

    container.innerHTML = `
      <div class="release-info">
        <span class="badge">Latest Stable Release</span>
        <h3>LABGUARD v${latestRel.version}</h3>
        <p class="release-meta-list">
          <span class="release-meta-item">Released: <strong>${window.formatDate(latestRel.release_date || latestRel.created_at)}</strong></span>
          <span class="release-meta-item">Size: <strong>${window.formatFileSize(latestRel.file_size)}</strong></span>
          <span class="release-meta-item">OS: <strong>Windows 10 / 11</strong></span>
        </p>
        <div class="release-changelog">
          <h4>Release Highlights</h4>
          <ul>${changelogHtml}</ul>
        </div>
        <div class="release-actions">
          ${hasValidUrl ? `
            <a href="${directDownloadHref}" class="btn btn-primary download-btn" data-release-id="${latestRel.id}" data-version="${latestRel.version}" target="_blank" rel="noopener noreferrer">
              <span>📥</span> Download for Windows
            </a>
          ` : `
            <button class="btn btn-primary" onclick="alert('The installer file URL is being updated by the administrator. Please check back shortly!')">
              <span>📥</span> Download for Windows
            </button>
          `}
          <a href="release-notes.html" class="btn btn-secondary">View Release Notes</a>
        </div>
      </div>
      <div class="release-badge-box">
        <div class="win-icon">💻</div>
        <h5>Windows Enterprise Ready</h5>
        <p>Minimum Supported: v${latestRel.minimum_supported_version || '2.0.0'}</p>
        <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--electric-blue);">${latestRel.file_name || 'LABGUARD-Setup.exe'}</p>
      </div>
    `;

    attachDownloadListeners();

  } catch (error) {
    console.error("Error loading latest release:", error);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>Unable to load release data</h3>
        <p>Please check your connection or upload a release from Admin Portal.</p>
      </div>
    `;
  }
}

async function loadDownloadsPage() {
  const container = document.getElementById('downloadsListContainer');
  if (!container) return;

  try {
    const data = await window.LabguardDB.fetchAllReleases();

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No releases available</h3>
          <p>There are currently no uploaded LABGUARD downloads.</p>
        </div>
      `;
      return;
    }

    let html = '';
    for (const rel of data) {
      const isLatest = rel.is_latest;
      const downloadHref = await window.LabguardDB.getDownloadUrlForRelease(rel);
      const hasValidUrl = downloadHref && downloadHref.startsWith('http');

      html += `
        <div class="release-item-card">
          <div class="release-item-info">
            <h3>
              LABGUARD v${rel.version}
              ${isLatest ? '<span class="latest-tag">Latest</span>' : ''}
            </h3>
            <div class="release-item-details">
              <span>📅 ${window.formatDate(rel.release_date || rel.created_at)}</span>
              <span>📦 ${window.formatFileSize(rel.file_size)}</span>
              <span>💻 Win 10 / 11</span>
            </div>
            <p class="release-item-desc">${rel.release_notes || 'Enterprise lab security & protection package.'}</p>
          </div>
          <div class="release-item-actions">
            ${hasValidUrl ? `
              <a href="${downloadHref}" class="btn btn-primary btn-sm download-btn" data-release-id="${rel.id}" data-version="${rel.version}" target="_blank" rel="noopener noreferrer">
                📥 Download
              </a>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="alert('Download URL is being updated.')">
                📥 Download
              </button>
            `}
            <a href="release-notes.html" class="btn btn-secondary btn-sm">
              📄 Details
            </a>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    attachDownloadListeners();

  } catch (error) {
    console.error("Error loading downloads:", error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Error loading downloads</h3>
        <p>Could not retrieve release files from server.</p>
      </div>
    `;
  }
}

async function loadReleaseNotesPage() {
  const container = document.getElementById('releaseNotesTimeline');
  if (!container) return;

  try {
    const data = await window.LabguardDB.fetchAllReleases();

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No release notes available</h3>
          <p>No release documentation has been uploaded yet.</p>
        </div>
      `;
      return;
    }

    let html = '';
    for (const rel of data) {
      const downloadHref = await window.LabguardDB.getDownloadUrlForRelease(rel);
      const hasValidUrl = downloadHref && (downloadHref.startsWith('http') || downloadHref.startsWith('blob:'));
      const changelogItems = rel.changelog
        ? rel.changelog.split('\n').map(item => `<li>${item.trim()}</li>`).join('')
        : '<li>General stability improvements and bug fixes.</li>';

      html += `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-version">v${rel.version} ${rel.is_latest ? '<span class="latest-tag">Latest</span>' : ''}</span>
              <span class="timeline-date">${window.formatDate(rel.release_date || rel.created_at)}</span>
            </div>
            <div class="timeline-body">
              <p><strong>Overview:</strong> ${rel.release_notes || 'System protection & laboratory management updates.'}</p>
              <h5>Changelog</h5>
              <ul>${changelogItems}</ul>
              <div style="margin-top: 1.5rem;">
                ${hasValidUrl ? `
                  <a href="${downloadHref}" class="btn btn-secondary btn-sm download-btn" data-release-id="${rel.id}" data-version="${rel.version}" target="_blank" rel="noopener noreferrer">
                    📥 Download v${rel.version} (${window.formatFileSize(rel.file_size)})
                  </a>
                ` : `
                  <button class="btn btn-secondary btn-sm" onclick="alert('The download link for this version is being configured in the Admin Portal.')">
                    ⏳ Link Updating
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    attachDownloadListeners();

  } catch (error) {
    console.error("Error loading release notes:", error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Error loading release notes</h3>
        <p>Could not retrieve timeline data.</p>
      </div>
    `;
  }
}

function attachDownloadListeners() {
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const releaseId = btn.getAttribute('data-release-id');
      const version = btn.getAttribute('data-version');
      if (releaseId && version && window.supabaseClient) {
        try {
          await window.supabaseClient.from('downloads').insert([{ release_id: releaseId, version: version }]);
        } catch (err) {}
      }
    });
  });
}

window.loadLatestReleaseOnHome = loadLatestReleaseOnHome;
window.loadDownloadsPage = loadDownloadsPage;
window.loadReleaseNotesPage = loadReleaseNotesPage;
