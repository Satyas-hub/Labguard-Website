/**
 * LABGUARD - Downloads & Public Pages Loader
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('latestReleaseContainer') && window.loadLatestReleaseOnHome) {
    window.loadLatestReleaseOnHome();
  }

  if (document.getElementById('downloadsListContainer') && window.loadDownloadsPage) {
    window.loadDownloadsPage();
  }

  if (document.getElementById('releaseNotesTimeline') && window.loadReleaseNotesPage) {
    window.loadReleaseNotesPage();
  }
});
