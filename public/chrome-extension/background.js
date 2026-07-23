chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "detect-ai",
    title: "Detect AI with AIDetector.cx",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "humanize-ai",
    title: "Humanize Text with AIDetector.cx",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const text = info.selectionText;
  if (!text) return;
  
  if (info.menuItemId === "detect-ai") {
    openToolTab("detect", text);
  } else if (info.menuItemId === "humanize-ai") {
    openToolTab("humanize", text);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openTool") {
    openToolTab(request.tool, request.text);
  } else if (request.action === "sync_token") {
    chrome.storage.local.set({ sb_token: request.token });
  } else if (request.action === "openDetectPopup") {
    chrome.storage.local.set({ 
      pendingDetection: { text: request.text, url: request.url, title: request.title } 
    }, () => {
      // Try to open popup directly (Chrome 118+)
      if (chrome.action && chrome.action.openPopup) {
        chrome.action.openPopup({ windowId: sender.tab.windowId }).catch(err => {
          // Fallback to opening a small popup window if openPopup is not allowed
          chrome.windows.create({
            url: chrome.runtime.getURL("popup.html"),
            type: "popup",
            width: 360,
            height: 600
          });
        });
      } else {
        chrome.windows.create({
          url: chrome.runtime.getURL("popup.html"),
          type: "popup",
          width: 360,
          height: 600
        });
      }
    });
  }
});

function openToolTab(tool, text) {
  const endpoint = tool === 'detect' ? '/detector' : '/humanizer';
  const url = `https://aidetector.cx${endpoint}?text=${encodeURIComponent(text)}`;
  chrome.tabs.create({ url: url });
}
