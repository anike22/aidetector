document.addEventListener('DOMContentLoaded', () => {
  const inputText = document.getElementById('inputText');
  const btnDetect = document.getElementById('btnDetect');
  const btnHumanize = document.getElementById('btnHumanize');
  const btnGetPageText = document.getElementById('btnGetPageText');
  const resultBox = document.getElementById('resultBox');
  const resultTitle = document.getElementById('resultTitle');
  const resultText = document.getElementById('resultText');
  const btnCopy = document.getElementById('btnCopy');
  const contextArea = document.getElementById('contextArea');
  const loading = document.getElementById('loading');
  const errorBox = document.getElementById('error');
  const disconnectedBox = document.getElementById('disconnected');
  const mainUI = document.getElementById('mainUI');
  const btnConnect = document.getElementById('btnConnect');

  let authToken = null;
  const API_URL = 'https://hzjnrmxwzkeaodvusszx.supabase.co/functions/v1';

  chrome.storage.local.get(['sb_token', 'pendingDetection'], (result) => {
    if (result.sb_token) {
      authToken = result.sb_token;
      disconnectedBox.style.display = 'none';
      mainUI.style.display = 'block';
      
      if (result.pendingDetection) {
        inputText.value = result.pendingDetection.text;
        inputText.scrollTop = 0;
        if (result.pendingDetection.title || result.pendingDetection.url) {
          contextArea.textContent = `Source: ${result.pendingDetection.title || result.pendingDetection.url}`;
          contextArea.title = result.pendingDetection.url || '';
          contextArea.style.display = 'block';
        }
        chrome.storage.local.remove('pendingDetection');
        setTimeout(() => {
          btnDetect.click();
        }, 100);
      } else {
        getPageText('getSelectedText');
      }
    } else {
      disconnectedBox.style.display = 'block';
      mainUI.style.display = 'none';
    }
  });

  btnConnect.addEventListener('click', () => {
    chrome.tabs.create({ url: "https://aidetector.cx/dashboard" });
  });

  const getPageText = (actionType) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: actionType }, (response) => {
          if (!chrome.runtime.lastError && response && response.text && response.text.trim()) {
            inputText.value = response.text.trim();
            inputText.scrollTop = 0; // Scroll to top
            
            // Always show context if we auto-extracted
            if (response.title || response.url) {
              contextArea.textContent = `Source: ${response.title || response.url}`;
              contextArea.title = response.url || '';
              contextArea.style.display = 'block';
            }
          } else if (actionType === 'getPageText') {
            inputText.value = "No readable text found on this page. Please select text or paste manually.";
          }
        });
      }
    });
  };

  btnGetPageText.addEventListener('click', () => {
    inputText.value = 'Extracting page text...';
    contextArea.style.display = 'none';
    getPageText('getPageText');
  });

  const showError = (msg) => {
    errorBox.innerHTML = msg + ' <button id="btnReconnect" style="margin-top:8px; width:100%; background:#ef4444; color:white; border:none; padding:6px; border-radius:4px;">Reconnect / Check Login</button>';
    errorBox.style.display = 'block';
    resultBox.classList.remove('visible');
    
    document.getElementById('btnReconnect').addEventListener('click', () => {
      chrome.tabs.create({ url: "https://aidetector.cx/dashboard" });
    });
  };

  const processApi = async (action, text) => {
    if (!text || text.length < 10) {
      errorBox.textContent = 'Please enter at least 10 characters.';
      errorBox.style.display = 'block';
      return;
    }

    errorBox.style.display = 'none';
    loading.style.display = 'block';
    resultBox.classList.remove('visible');
    btnDetect.disabled = true;
    btnHumanize.disabled = true;
    btnCopy.style.display = 'none';

    try {
      const endpoint = action === 'detect' ? `${API_URL}/run-detector` : `${API_URL}/run-humanizer`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(action === 'detect' ? { text, type: 'text' } : { 
          action, 
          text,
          level: '2',
          tone: 'standard',
          preserveSeo: true
        })
      });

      if (!res.ok) {
        throw new Error('API Error or Rate Limit. Try reconnecting.');
      }

      if (action === 'detect') {
        const data = await res.json();
        resultTitle.textContent = "AI Detection Score";
        resultText.innerHTML = `<strong>AI Probability:</strong> <span style="font-size: 18px; color: ${data.aiProbability > 50 ? '#ef4444' : '#10b981'};">${data.aiProbability}%</span>`;
        resultBox.classList.add('visible');
      } else if (action === 'humanize') {
        // Humanize returns SSE stream, but for extension popup we can just read the whole stream easily or read it chunk by chunk
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullOutput = '';
        let buffer = '';
        
        resultTitle.textContent = "Humanized Text";
        resultText.textContent = "Loading...";
        btnCopy.style.display = 'block';
        btnCopy.textContent = 'Copy';
        btnCopy.disabled = true;
        btnCopy.style.opacity = '0.5';
        resultBox.classList.add('visible');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            btnCopy.disabled = false;
            btnCopy.style.opacity = '1';
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.text) {
                  fullOutput += data.text;
                  resultText.textContent = fullOutput;
                }
              } catch(e) {}
            }
          }
        }
      }
    } catch (err) {
      showError(err.message);
    } finally {
      loading.style.display = 'none';
      btnDetect.disabled = false;
      btnHumanize.disabled = false;
    }
  };

  btnDetect.addEventListener('click', () => {
    processApi('detect', inputText.value.trim());
  });

  btnHumanize.addEventListener('click', () => {
    processApi('humanize', inputText.value.trim());
  });

  btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(resultText.textContent).then(() => {
      btnCopy.textContent = 'Copied!';
      setTimeout(() => { btnCopy.textContent = 'Copy'; }, 2000);
    });
  });
});
