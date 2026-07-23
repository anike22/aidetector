let floatingBtn = null;

function createFloatingButton() {
  const btn = document.createElement('button');
  btn.id = 'aidetector-floating-btn';
  btn.innerHTML = '🔍 Detect AI';
  btn.style.cssText = `
    position: absolute !important;
    z-index: 2147483647 !important;
    background: #2563eb !important;
    color: #fff !important;
    border: 2px solid #fff !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    transition: transform 0.1s !important;
    line-height: 1 !important;
    text-transform: none !important;
  `;
  btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';
  
  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const text = window.getSelection().toString().trim();
    chrome.runtime.sendMessage({
      action: "openDetectPopup",
      text: text,
      title: document.title,
      url: window.location.href
    });
    btn.style.display = 'none';
  });
  
  return btn;
}

document.addEventListener('mouseup', (e) => {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 10) {
      if (!floatingBtn) {
        floatingBtn = createFloatingButton();
        document.body.appendChild(floatingBtn);
      }
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      floatingBtn.style.top = `${window.scrollY + rect.top - 45}px`;
      floatingBtn.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 60}px`;
      floatingBtn.style.display = 'flex';
    } else {
      if (floatingBtn) {
        floatingBtn.style.display = 'none';
      }
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (floatingBtn && e.target !== floatingBtn) {
    floatingBtn.style.display = 'none';
  }
});

function getMainPageText() {
  const allElements = document.querySelectorAll('div, article, main, section');
  let bestElement = document.body;
  let maxScore = 0;
  
  allElements.forEach(el => {
    // Basic heuristic: length of text and number of paragraphs
    const textLen = el.innerText.length;
    const pCount = el.querySelectorAll('p').length;
    
    // Ignore containers that are too small
    if (textLen < 200) return;
    
    // Score based on paragraph density to text length ratio
    const score = pCount * 200 + textLen;
    
    // Prevent selecting the whole body if a more specific container is better
    if (el.tagName !== 'BODY' && score > maxScore) {
      // Ensure the container actually has a good density of text, to avoid grabbing main wrappers
      const wrapperElements = ['HEADER', 'FOOTER', 'NAV', 'ASIDE'];
      if (!wrapperElements.includes(el.tagName)) {
         maxScore = score;
         bestElement = el;
      }
    }
  });
  
  if (maxScore > 0 && bestElement) {
    return bestElement.innerText;
  }
  return document.body.innerText;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText" || request.action === "getPageText") {
    let text = window.getSelection().toString().trim();
    
    if (request.action === "getPageText" || !text) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
        text = activeEl.value;
      } else if (activeEl && activeEl.isContentEditable) {
        text = activeEl.innerText;
      }
      
      if (!text || text.trim() === '') {
        text = getMainPageText();
      }
    }
    
    sendResponse({ text: text || "", title: document.title, url: window.location.href });
  }
});
