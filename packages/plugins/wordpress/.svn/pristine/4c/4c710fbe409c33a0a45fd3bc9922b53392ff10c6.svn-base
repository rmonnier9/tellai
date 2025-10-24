// Initialize plugin settings
let lovarankPluginSettings = {
  apiKey: document.getElementById('api_key')?.value.trim() || '',
};

// Load settings on page load
function lovarankLoadSettings() {
  const input = document.getElementById('api_key');
  if (input) lovarankPluginSettings.apiKey = input.value.trim();
  updateStatus();
}

// Display a notification message
function lovarankShowNotice(message, type = 'success') {
  const notice = document.getElementById('notice');
  const messageSpan = document.getElementById('notice-message');

  if (!notice || !messageSpan) return;

  notice.className = `notice notice-${type}`;
  messageSpan.textContent = message;
  notice.style.display = 'block';

  setTimeout(() => {
    notice.style.display = 'none';
  }, 4000);
}

// Update status badge based on API key
function updateStatus() {
  const status = document.getElementById('fetch-status');
  if (!status) return;

  if (lovarankPluginSettings.apiKey) {
    status.textContent = 'Active';
    status.className = 'status-badge active';
  } else {
    status.textContent = 'Inactive';
    status.className = 'status-badge inactive';
  }
}

// Handle form submission for saving API key
document.getElementById('api-form')?.addEventListener('submit', function (e) {
  e.preventDefault();

  const apiKeyInput = document.getElementById('api_key');
  const saveBtn = document.getElementById('save-btn');
  const form = document.getElementById('api-form');

  const apiKey = apiKeyInput?.value.trim();
  if (!apiKey) {
    lovarankShowNotice('❌ Please enter an API key', 'error');
    return;
  }

  if (!saveBtn || !form) return;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  // Save to JS config
  lovarankPluginSettings.apiKey = apiKey;
  updateStatus();
  lovarankShowNotice('✅ API key saved successfully!');

  // Temporarily remove event listener to avoid recursion
  form.removeEventListener('submit', arguments.callee);

  // Use setTimeout to allow UI updates before submission
  setTimeout(() => {
    form.submit();
  }, 100);
});

// Handle AJAX "Fetch Articles Now" button
// document.addEventListener('DOMContentLoaded', function () {
//     const saveBtn = document.getElementById('save-btn');
//     if (!saveBtn) return;

//     saveBtn.addEventListener('click', function () {
//         saveBtn.disabled = true;
//         saveBtn.textContent = 'Saving...';

//         fetch(lovarankAjax.ajaxurl, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             },
//             body: new URLSearchParams({
//                 action: 'lovarank_fetch_articles_now',
//                 security: lovarankAjax.nonce
//             })
//         })
//         .then(response => response.json())
//         .then(data => {
//             saveBtn.disabled = false;
//             lovarankShowNotice(data?.data?.message || '✅ Fetched successfully!');
//             saveBtn.textContent = 'Save & Sync';
//             setTimeout(() => window.location.reload(), 1000);
//         })
//         .catch(() => {
//             lovarankShowNotice('❌ Failed to fetch articles. Please try again.', 'error');
//             saveBtn.disabled = false;
//             saveBtn.textContent = 'Save & Sync';
//         });
//     });
// });

// Load initial settings
lovarankLoadSettings();
