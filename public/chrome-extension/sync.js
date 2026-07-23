// Read Supabase auth token from local storage
function syncToken() {
  let token = null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('auth-token')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.access_token) {
          token = data.access_token;
          break;
        }
      } catch (e) {}
    }
  }
  if (token) {
    chrome.runtime.sendMessage({ action: "sync_token", token: token });
  }
}
syncToken();
setInterval(syncToken, 5000); // Check every 5 seconds
