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
  // Work on detached copies so the live webpage is never modified.
  const excludedSelectors = [
    'script', 'style', 'noscript', 'svg', 'canvas',
    'header', 'footer', 'nav', 'aside',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '[role="complementary"]', '[aria-hidden="true"]',
    'form', 'button', 'input', 'textarea', 'select',
    '[class*="subscribe" i]', '[class*="subscription" i]',
    '[class*="paywall" i]', '[class*="modal" i]',
    '[class*="popover" i]', '[class*="tooltip" i]',
    '[class*="comment" i]', '[class*="recommend" i]',
    '[class*="related" i]', '[class*="share" i]',
    '[class*="social" i]', '[class*="advert" i]',
    '[id*="subscribe" i]', '[id*="paywall" i]',
    '[id*="comment" i]', '[id*="recommend" i]'
  ];

  const cleanClone = (element) => {
    const clone = element.cloneNode(true);
    clone.querySelectorAll(excludedSelectors.join(',')).forEach(node => node.remove());
    return clone;
  };

  const getTextMetrics = (element) => {
    const clone = cleanClone(element);
    const text = (clone.innerText || clone.textContent || '')
      .replace(/[\t\u00a0 ]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!text) return { text: '', score: 0 };

    const paragraphs = Array.from(clone.querySelectorAll('p, h1, h2, h3, blockquote, pre'))
      .map(node => (node.innerText || node.textContent || '').trim())
      .filter(value => value.length >= 35);
    const paragraphText = paragraphs.join('\n\n');
    const linkTextLength = Array.from(clone.querySelectorAll('a'))
      .reduce((total, link) => total + (link.innerText || link.textContent || '').trim().length, 0);
    const linkDensity = text.length ? Math.min(1, linkTextLength / text.length) : 1;
    const meaningfulLength = paragraphText.length || text.length;
    const score = meaningfulLength + (paragraphs.length * 180) - (linkDensity * text.length * 1.5);
    return { text: paragraphText.length >= 180 ? paragraphText : text, score, linkDensity };
  };

  const selectors = [
    '[itemprop="articleBody"]',
    'article',
    'main',
    '[role="main"]',
    '.available-content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.article-body',
    '.post-body',
    '.story-body'
  ];

  const candidates = [];
  const seen = new Set();
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      if (seen.has(element)) return;
      seen.add(element);
      const metrics = getTextMetrics(element);
      if (metrics.text.length >= 180 && metrics.linkDensity < 0.45) {
        const semanticBoost = selector === '[itemprop="articleBody"]' ? 1800
          : selector === 'article' ? 1200
          : selector === '.available-content' ? 900
          : selector === 'main' || selector === '[role="main"]' ? 500 : 0;
        candidates.push({ ...metrics, score: metrics.score + semanticBoost });
      }
    });
  });

  // Prefer a focused article/content region over a large page wrapper.
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length && candidates[0].text.length >= 180) {
    return candidates[0].text;
  }

  // Fallback for sites without semantic article markup: clean the body and
  // remove navigation, controls, promotions and other non-reading regions.
  const bodyMetrics = getTextMetrics(document.body);
  return bodyMetrics.text || '';
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
