jQuery(document).ready(function($) {
    const apiKey = window.aidetectorData ? window.aidetectorData.apiKey : '';
    const apiUrl = window.aidetectorData ? window.aidetectorData.apiUrl : '';

    const container = $('#aidetector-classic-app');
    
    if (!apiKey) {
        container.html('<p>Please configure your API key in Settings > AIDetector.</p>');
        return;
    }

    const html = `
        <div class="aidetector-classic-container">
            <div class="panel">
                <h4>SEO Assistant & AI Detection</h4>
                <div style="margin-bottom: 10px;">
                    <label style="display:block; margin-bottom:5px;"><strong>Focus Keyword</strong></label>
                    <input type="text" id="aid-focus-keyword" style="width: 100%; max-width: 400px;" placeholder="Enter target keyword">
                </div>
                <button type="button" id="aid-analyze-btn" class="button button-primary">Analyze Content</button>
                
                <div id="aid-analyze-results" style="display:none; margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; max-width: 400px; margin-bottom: 15px; background: #f6f7f7; padding: 10px; border-radius: 4px;">
                        <div>
                            <strong style="font-size: 12px; color: #646970;">SEO Score</strong>
                            <div id="aid-seo-score" style="font-size: 24px; font-weight: bold; color: #2271b1;">-</div>
                        </div>
                        <div>
                            <strong style="font-size: 12px; color: #646970;">Readability</strong>
                            <div id="aid-read-score" style="font-size: 24px; font-weight: bold; color: #00a32a;">-</div>
                        </div>
                        <div>
                            <strong style="font-size: 12px; color: #646970;">Density</strong>
                            <div id="aid-seo-density" style="font-size: 24px; font-weight: bold; color: #d63638;">-</div>
                        </div>
                        <div>
                            <strong style="font-size: 12px; color: #646970;">AI Prob.</strong>
                            <div id="aid-ai-prob-text" style="font-size: 24px; font-weight: bold; color: #e11d48;">-</div>
                        </div>
                    </div>
                    
                    <div id="aid-seo-details"></div>
                </div>
            </div>
            
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
            
            <div class="panel">
                <h4>AI Humanizer</h4>
                <p>Rewrite content to bypass AI detectors while maintaining meaning and SEO value.</p>
                <button type="button" id="aid-humanize-btn" class="button button-secondary">Humanize Content</button>
                <div id="aid-humanize-results" style="display:none; margin-top: 15px;">
                    <strong>Generated Text:</strong>
                    <div id="aid-humanize-text" class="result-box" style="padding: 10px; background: #f9f9f9; border: 1px solid #ddd; margin: 10px 0; max-height: 200px; overflow-y: auto; white-space: pre-wrap;"></div>
                    <button type="button" id="aid-replace-btn" class="button button-primary">Apply to Editor</button>
                </div>
            </div>
        </div>
    `;

    container.html(html);

    function renderSeoItemHTML(title, content) {
        if (!content) return '';
        let displayContent = '';
        if (Array.isArray(content)) {
            displayContent = '<ul style="padding-left: 20px; list-style: disc; margin: 5px 0;">' + 
                content.map(item => typeof item === 'object' ? `<li>${item.question} - ${item.answer}</li>` : `<li>${item}</li>`).join('') +
                '</ul>';
        } else {
            displayContent = `<p style="font-size: 13px; margin: 5px 0; padding: 8px; background: #f0f0f1; border-radius: 4px;">${content}</p>`;
        }
        return `
            <div style="margin-bottom: 15px;">
                <strong style="display: block; font-size: 14px; margin-bottom: 4px; color: #1d2327;">${title}</strong>
                ${displayContent}
            </div>
        `;
    }

    function getEditorContent() {
        if (typeof wp !== 'undefined' && wp.editor && wp.editor.getContent) {
            return wp.editor.getContent('content');
        } else if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor) {
            return tinyMCE.activeEditor.getContent();
        } else {
            return $('#content').val();
        }
    }

    function setEditorContent(content) {
        if (typeof wp !== 'undefined' && wp.editor && wp.editor.setContent) {
            wp.editor.setContent(content);
        } else if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor) {
            tinyMCE.activeEditor.setContent(content);
        } else {
            $('#content').val(content);
        }
    }

    function stripHtml(html) {
        let tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const fetchWithRetry = async (url, options, maxRetries = 2) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.status === 401) throw new Error('Invalid or expired API Key. Please verify in settings.');
                if (res.ok) return res;
                if (res.status >= 400 && res.status < 500 && res.status !== 429) return res;
                
                const errData = await res.clone().json().catch(() => null);
                throw new Error((errData && errData.error) ? errData.error : 'API Request Failed');
            } catch (e) {
                if (e.message.includes('Invalid or expired')) throw e;
                if (i === maxRetries - 1) throw e;
            }
            await sleep(1000 * (i + 1));
        }
        throw new Error('Unable to process now. Please try again later.');
    };

    $('#aid-analyze-btn').on('click', async function() {
        const btn = $(this);
        const content = getEditorContent();
        const title = $('#title').val() || '';
        const keyword = $('#aid-focus-keyword').val() || '';
        const plainText = stripHtml(content);

        if (!plainText) {
            alert("Please enter some content first.");
            return;
        }

        btn.text('Analyzing...').prop('disabled', true);
        
        try {
            const pDet = fetchWithRetry(`${apiUrl}/run-detector`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ text: plainText, type: 'text', service: window.aidetectorData.detectorService })
            });
            const pSeo = fetchWithRetry(`${apiUrl}/plugin-seo-analyzer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ title: title, content: plainText, keyword: keyword, service: window.aidetectorData.seoService })
            });

            const [resDet, resSeo] = await Promise.all([pDet, pSeo]);

            if (resDet.status === 401 || resSeo.status === 401) throw new Error('Invalid or expired API Key. Please verify in settings.');
            if (!resDet.ok || !resSeo.ok) throw new Error('API Request Failed');
            
            const dataDet = await resDet.json();
            const dataSeo = await resSeo.json();
            
            $('#aid-analyze-results').show();
            $('#aid-ai-prob-text')
                .text(`${dataDet.aiProbability || 0}%`)
                .css('color', dataDet.aiProbability > 50 ? '#e11d48' : '#10b981');
                
            $('#aid-seo-score').text(dataSeo.seoScore || '-');
            $('#aid-read-score').text(dataSeo.readabilityScore || '-');
            $('#aid-seo-density').text(dataSeo.keywordDensity || 'N/A');
            
            let detailsHtml = '';
            detailsHtml += renderSeoItemHTML('Feedback', dataSeo.feedback);
            detailsHtml += renderSeoItemHTML('Missing Keywords', dataSeo.missingKeywords ? dataSeo.missingKeywords.join(', ') : null);
            detailsHtml += renderSeoItemHTML('Meta Title Suggestion', dataSeo.metaTitleSuggestion);
            detailsHtml += renderSeoItemHTML('Meta Description Suggestion', dataSeo.metaDescriptionSuggestion);
            detailsHtml += renderSeoItemHTML('Heading Analysis', dataSeo.headingAnalysis);
            detailsHtml += renderSeoItemHTML('Internal Link Suggestions', dataSeo.internalLinkSuggestions);
            detailsHtml += renderSeoItemHTML('External Link Suggestions', dataSeo.externalLinkSuggestions);
            detailsHtml += renderSeoItemHTML('FAQ Suggestions', dataSeo.faqSuggestions);
            detailsHtml += renderSeoItemHTML('Schema Suggestions', dataSeo.schemaSuggestions ? dataSeo.schemaSuggestions.join(', ') : null);
            detailsHtml += renderSeoItemHTML('Featured Snippet Suggestions', dataSeo.featuredSnippetSuggestions);

            $('#aid-seo-details').html(detailsHtml);
                
        } catch (e) {
            $('#aid-detector-result').html('<p style="color:red; font-weight:bold;">' + e.message + '</p>');
        } finally {
            btn.text('Analyze Content').prop('disabled', false);
        }
    });

    $('#aid-humanize-btn').on('click', async function() {
        const btn = $(this);
        const content = getEditorContent();
        const plainText = stripHtml(content);

        if (!plainText) {
            alert("Please enter some content first.");
            return;
        }

        btn.text('Humanizing...').prop('disabled', true);
        $('#aid-humanize-results').show();
        $('#aid-humanize-text').text('');
        
        try {
            const res = await fetchWithRetry(`${apiUrl}/run-humanizer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ text: plainText, action: 'humanize', level: 'standard', preserveSeo: true, service: window.aidetectorData.humanizerService })
            });

            if (res.status === 401) throw new Error('Invalid or expired API Key. Please verify in settings.');
            if (!res.ok) throw new Error('API Request Failed');
            
            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let fullOutput = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]') continue;
                        if (!dataStr) continue;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.text) {
                                fullOutput += data.text;
                                $('#aid-humanize-text').text(fullOutput);
                            }
                        } catch (e) {}
                    }
                }
            }
        } catch (e) {
            $('#aid-humanize-result').html('<p style="color:red; font-weight:bold;">' + e.message + '</p>');
        } finally {
            btn.text('Humanize Content').prop('disabled', false);
        }
    });

    $('#aid-replace-btn').on('click', function() {
        const text = $('#aid-humanize-text').text();
        if (text) {
            const formatted = text.split('\n\n').map(p => `<p>${p}</p>`).join('');
            setEditorContent(formatted);
        }
    });
});
