const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

// Load saved state
chrome.storage.local.get(['enabled'], ({ enabled }) => {
  toggle.checked = Boolean(enabled);
  status.textContent = enabled ? 'On' : 'Off';
});

// When user flips the switch
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.runtime.sendMessage({ action: 'setEnabled', enabled });
  status.textContent = enabled ? 'On' : 'Off';
});
