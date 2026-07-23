(function() {
    const { registerPlugin } = wp.plugins;
    const { PluginSidebar } = wp.editPost;
    const { createElement: el, useState, useEffect } = wp.element;
    const { Button, PanelBody, PanelRow, TextControl, Spinner, Notice } = wp.components;
    const { useSelect, useDispatch } = wp.data;

    const AIDetectorSidebar = () => {
        const [isAnalyzing, setIsAnalyzing] = useState(false);
        const [isHumanizing, setIsHumanizing] = useState(false);
        const [analysisResult, setAnalysisResult] = useState(null);
        const [seoResult, setSeoResult] = useState(null);
        const [humanizeResult, setHumanizeResult] = useState('');
        const [error, setError] = useState(null);
        const [focusKeyword, setFocusKeyword] = useState('');
        
        const postContent = useSelect((select) => {
            try { return select('core/editor').getEditedPostContent() || ''; } catch(e) { return ''; }
        }, []);
        const postTitle = useSelect((select) => {
            try { return select('core/editor').getEditedPostAttribute('title') || ''; } catch(e) { return ''; }
        }, []);
        const postMeta = useSelect((select) => {
            try { return select('core/editor').getEditedPostAttribute('meta') || {}; } catch(e) { return {}; }
        }, []);
        const selectedBlock = useSelect((select) => {
            try { return select('core/block-editor').getSelectedBlock() || null; } catch(e) { return null; }
        }, []);
        
        const { editPost } = useDispatch('core/editor');
        const { updateBlock } = useDispatch('core/block-editor');

        // Load existing SEO results on mount
        useEffect(() => {
            if (postMeta && postMeta._aidetector_seo_results) {
                try {
                    const parsed = JSON.parse(postMeta._aidetector_seo_results);
                    if (parsed.seoScore) setSeoResult(parsed);
                } catch (e) {}
            }
        }, []);

        const apiKey = window.aidetectorData ? window.aidetectorData.apiKey : '';
        const apiUrl = window.aidetectorData ? window.aidetectorData.apiUrl : '';

        if (!apiKey) {
            return el(PanelBody, { title: 'AIDetector Settings' },
                el('p', { style: { color: 'red', fontWeight: 'bold' } }, 'Not Connected'),
                el('p', null, 'Please configure your API key or log in via Account Login in Settings > AIDetector.')
            );
        }

        const renderSeoItem = (title, content) => {
            if (!content) return null;
            let displayContent = null;
            if (Array.isArray(content)) {
                displayContent = el('ul', { style: { paddingLeft: '20px', listStyle: 'disc', margin: '5px 0' } }, 
                    content.map((item, i) => el('li', { key: i, style: { fontSize: '13px', marginBottom: '4px' } }, typeof item === 'object' ? `${item.question} - ${item.answer}` : item))
                );
            } else {
                displayContent = el('p', { style: { fontSize: '13px', margin: '5px 0', padding: '8px', background: '#f0f0f1', borderRadius: '4px' } }, content);
            }
            return el('div', { style: { marginBottom: '15px' } },
                el('strong', { style: { display: 'block', fontSize: '14px', marginBottom: '4px', color: '#1d2327' } }, title),
                displayContent
            );
        };

        const handleAnalyze = async () => {
            setIsAnalyzing(true);
            setError(null);
            try {
                const plainText = postContent.replace(/<[^>]*>?/gm, '');
                if (!plainText) throw new Error("Please add some content to analyze.");
                
                // 1. AI Detection
                const detRes = await fetchWithRetry(`${apiUrl}/run-detector`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ text: plainText, type: 'text', service: window.aidetectorData.detectorService })
                });
                
                // 2. SEO Analysis
                const seoRes = await fetchWithRetry(`${apiUrl}/plugin-seo-analyzer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ title: postTitle, content: plainText, keyword: focusKeyword, service: window.aidetectorData.seoService })
                });

                if (detRes.status === 401 || seoRes.status === 401) throw new Error('Invalid or expired API Key. Please verify in settings.');
                if (!detRes.ok || !seoRes.ok) throw new Error('API request failed');

                const newAnalysis = await detRes.json();
                const newSeo = await seoRes.json();
                
                setAnalysisResult(newAnalysis);
                setSeoResult(newSeo);
                
                // Save to post meta
                editPost({ meta: { ...postMeta, _aidetector_seo_results: JSON.stringify(newSeo), _aidetector_seo_score: newSeo.seoScore } });
            } catch (err) {
                setError('Analysis failed: ' + err.message);
            } finally {
                setIsAnalyzing(false);
            }
        };

        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const fetchWithRetry = async (url, options, maxRetries = 2) => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const res = await fetch(url, options);
                    if (res.status === 401) throw new Error('Invalid or expired API Key. Please verify in settings.');
                    if (res.ok) return res;
                    if (res.status >= 400 && res.status < 500 && res.status !== 429) return res;
                    
                    // If 500 or 429, try to parse error and then throw it so it can be retried or caught
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

        const handleHumanize = async () => {
            setIsHumanizing(true);
            setError(null);
            setHumanizeResult('');
            try {
                let targetText = '';
                if (selectedBlock && selectedBlock.name === 'core/paragraph') {
                    targetText = selectedBlock.attributes.content.replace(/<[^>]*>?/gm, '');
                } else {
                    targetText = postContent.replace(/<[^>]*>?/gm, '');
                }
                
                if (!targetText) throw new Error("Please select a paragraph block or add some content to humanize.");
                
                const res = await fetchWithRetry(`${apiUrl}/run-humanizer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ text: targetText, action: 'humanize', level: 'standard', preserveSeo: true, service: window.aidetectorData.humanizerService })
                });

                if (res.status === 401) throw new Error('Invalid or expired API Key. Please verify in settings.');
                if (!res.ok) throw new Error('API request failed');

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
                                    setHumanizeResult(fullOutput);
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (err) {
                setError('Humanize failed: ' + err.message);
            } finally {
                setIsHumanizing(false);
            }
        };

        const replaceContent = () => {
            if (humanizeResult) {
                if (selectedBlock && selectedBlock.name === 'core/paragraph') {
                    updateBlock(selectedBlock.clientId, { attributes: { content: humanizeResult } });
                } else {
                    const formatted = humanizeResult.split('\n\n').map(p => `<p>${p}</p>`).join('');
                    editPost({ content: formatted });
                }
            }
        };

        return el('div', { className: 'aidetector-sidebar-content' },
            error && el(Notice, { status: 'error', onRemove: () => setError(null) }, error),
            
            el(PanelBody, { title: 'SEO Assistant', initialOpen: true },
                el(TextControl, {
                    label: 'Focus Keyword',
                    value: focusKeyword,
                    onChange: (val) => setFocusKeyword(val),
                    placeholder: 'Enter target keyword'
                }),
                el(Button, { 
                    isPrimary: true, 
                    onClick: handleAnalyze,
                    disabled: isAnalyzing || !postContent,
                    style: { width: '100%', justifyContent: 'center' }
                }, isAnalyzing ? 'Analyzing...' : 'Analyze Content'),
                
                analysisResult && el('div', { className: 'aidetector-results' },
                    el('h4', null, 'AI Detection Score'),
                    el('div', { className: 'score-bar' }, 
                        el('div', { 
                            className: 'score-fill', 
                            style: { width: `${analysisResult.aiProbability || 0}%`, backgroundColor: analysisResult.aiProbability > 50 ? '#e11d48' : '#10b981' } 
                        })
                    ),
                    el('p', null, `AI Probability: ${analysisResult.aiProbability || 0}%`)
                ),
                
                seoResult && el('div', { className: 'aidetector-results', style: { marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '15px' } },
                    el('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', background: '#f6f7f7', padding: '10px', borderRadius: '4px' } },
                        el('div', null, el('strong', { style: { fontSize: '12px', color: '#646970' } }, 'SEO Score'), el('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#2271b1' } }, seoResult.seoScore)),
                        el('div', null, el('strong', { style: { fontSize: '12px', color: '#646970' } }, 'Readability'), el('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#00a32a' } }, seoResult.readabilityScore)),
                        el('div', null, el('strong', { style: { fontSize: '12px', color: '#646970' } }, 'Density'), el('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#d63638' } }, seoResult.keywordDensity || 'N/A'))
                    ),
                    renderSeoItem('Feedback', seoResult.feedback),
                    renderSeoItem('Missing Keywords', seoResult.missingKeywords ? seoResult.missingKeywords.join(', ') : null),
                    renderSeoItem('Meta Title Suggestion', seoResult.metaTitleSuggestion),
                    renderSeoItem('Meta Description Suggestion', seoResult.metaDescriptionSuggestion),
                    renderSeoItem('Heading Analysis', seoResult.headingAnalysis),
                    renderSeoItem('Internal Link Suggestions', seoResult.internalLinkSuggestions),
                    renderSeoItem('External Link Suggestions', seoResult.externalLinkSuggestions),
                    renderSeoItem('FAQ Suggestions', seoResult.faqSuggestions),
                    renderSeoItem('Schema Suggestions', seoResult.schemaSuggestions ? seoResult.schemaSuggestions.join(', ') : null),
                    renderSeoItem('Featured Snippet Suggestions', seoResult.featuredSnippetSuggestions)
                )
            ),
            
            el(PanelBody, { title: 'AI Humanizer', initialOpen: true },
                el('p', null, 'Rewrite content to bypass AI detectors while preserving meaning.'),
                el(Button, { 
                    isSecondary: true, 
                    onClick: handleHumanize,
                    disabled: isHumanizing || !postContent,
                    style: { width: '100%', justifyContent: 'center' }
                }, isHumanizing ? 'Humanizing...' : 'Humanize Content'),
                
                humanizeResult && el('div', { className: 'humanizer-result' },
                    el('h4', null, 'Generated Text:'),
                    el('div', { className: 'result-box' }, humanizeResult),
                    el(Button, { 
                        isPrimary: true, 
                        onClick: replaceContent,
                        style: { width: '100%', justifyContent: 'center', marginTop: '10px' }
                    }, 'Apply to Editor')
                )
            )
        );
    };

    registerPlugin('aidetector-sidebar', {
        icon: 'shield',
        render: () => el(PluginSidebar, { name: 'aidetector-sidebar', title: 'AIDetector & SEO', icon: 'shield' }, el(AIDetectorSidebar))
    });
})();
