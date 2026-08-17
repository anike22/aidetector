jQuery(document).ready(function($) {
    $('#doaction, #doaction2').on('click', function(e) {
        var selectId = $(this).attr('id') === 'doaction' ? '#bulk-action-selector-top' : '#bulk-action-selector-bottom';
        if ($(selectId).val() === 'run_aidetector_seo') {
            e.preventDefault();
            
            var postIds = [];
            $('input[name="post[]"]:checked').each(function() {
                postIds.push($(this).val());
            });
            
            if (postIds.length === 0) {
                alert('Please select at least one post.');
                return;
            }
            
            // Show modal
            $('body').append(`
                <div id="aidetector-bulk-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;">
                    <div style="background:#fff;padding:30px;border-radius:8px;width:400px;text-align:center;">
                        <h2>Running SEO Assistant</h2>
                        <p>Processing <span id="aidetector-current-idx">0</span> of ${postIds.length}</p>
                        <div style="width:100%;background:#eee;border-radius:4px;height:20px;margin:20px 0;overflow:hidden;">
                            <div id="aidetector-progress-bar" style="width:0%;height:100%;background:#2271b1;transition:width 0.3s;"></div>
                        </div>
                        <ul id="aidetector-log" style="text-align:left;height:100px;overflow-y:auto;font-size:12px;background:#f9f9f9;padding:10px;border:1px solid #ddd;"></ul>
                        <button id="aidetector-bulk-close" class="button button-primary" style="display:none;" onclick="location.reload()">Close & Reload</button>
                    </div>
                </div>
            `);
            
            var currentIdx = 0;
            
            function processNext() {
                if (currentIdx >= postIds.length) {
                    $('#aidetector-log').append('<li><strong style="color:green;">Done!</strong></li>');
                    $('#aidetector-bulk-close').show();
                    return;
                }
                
                var pId = postIds[currentIdx];
                $('#aidetector-current-idx').text(currentIdx + 1);
                
                $.post(ajaxurl, {
                    action: 'aidetector_process_single_seo',
                    post_id: pId,
                    nonce: aidetectorBulk.nonce
                }, function(res) {
                    if (res.success) {
                        $('#aidetector-log').append(`<li>Post ${pId}: Success (Score: ${res.data.score})</li>`);
                    } else {
                        $('#aidetector-log').append(`<li><span style="color:red;">Post ${pId}: Failed (${res.data || 'Unknown error'})</span></li>`);
                    }
                    
                    currentIdx++;
                    var pct = Math.round((currentIdx / postIds.length) * 100);
                    $('#aidetector-progress-bar').css('width', pct + '%');
                    
                    // Scroll to bottom of log
                    var logEl = document.getElementById('aidetector-log');
                    logEl.scrollTop = logEl.scrollHeight;
                    
                    processNext();
                }).fail(function() {
                    $('#aidetector-log').append(`<li><span style="color:red;">Post ${pId}: Server Error</span></li>`);
                    currentIdx++;
                    var pct = Math.round((currentIdx / postIds.length) * 100);
                    $('#aidetector-progress-bar').css('width', pct + '%');
                    processNext();
                });
            }
            
            processNext();
        }
    });
});
