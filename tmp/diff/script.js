let currentView = 'unified';
let diffData = null;

function compare() {
    const oldText = document.getElementById('oldText').value;
    const newText = document.getElementById('newText').value;
    
    if (!oldText && !newText) {
        alert('テキストを入力してください');
        return;
    }

    diffData = computeDiff(oldText, newText);
    renderDiff();
    
    document.getElementById('statsBar').style.display = 'flex';
    document.getElementById('resultPanel').style.display = 'block';
    
    document.getElementById('addCount').textContent = diffData.stats.added;
    document.getElementById('removeCount').textContent = diffData.stats.removed;
    document.getElementById('changeCount').textContent = diffData.stats.changed;
    document.getElementById('sameCount').textContent = diffData.stats.same;
}

function computeDiff(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    // LCS-based diff
    const lcs = computeLCS(oldLines, newLines);
    const diff = [];
    let stats = { added: 0, removed: 0, changed: 0, same: 0 };
    
    let oldIdx = 0, newIdx = 0, lcsIdx = 0;
    
    while (oldIdx < oldLines.length || newIdx < newLines.length) {
        if (lcsIdx < lcs.length && oldIdx < oldLines.length && newIdx < newLines.length &&
            oldLines[oldIdx] === lcs[lcsIdx] && newLines[newIdx] === lcs[lcsIdx]) {
            diff.push({ type: 'same', oldLine: oldIdx + 1, newLine: newIdx + 1, content: oldLines[oldIdx] });
            stats.same++;
            oldIdx++; newIdx++; lcsIdx++;
        } else if (newIdx >= newLines.length || 
                  (oldIdx < oldLines.length && (lcsIdx >= lcs.length || oldLines[oldIdx] !== lcs[lcsIdx]))) {
            // Check if it's a change (similar line exists in new)
            if (newIdx < newLines.length && oldLines[oldIdx] && newLines[newIdx] && 
                similarity(oldLines[oldIdx], newLines[newIdx]) > 0.5) {
                diff.push({ type: 'change', oldLine: oldIdx + 1, newLine: newIdx + 1, 
                           oldContent: oldLines[oldIdx], newContent: newLines[newIdx] });
                stats.changed++;
                oldIdx++; newIdx++;
            } else {
                diff.push({ type: 'remove', oldLine: oldIdx + 1, content: oldLines[oldIdx] });
                stats.removed++;
                oldIdx++;
            }
        } else {
            diff.push({ type: 'add', newLine: newIdx + 1, content: newLines[newIdx] });
            stats.added++;
            newIdx++;
        }
    }
    
    return { diff, stats, oldLines, newLines };
}

function computeLCS(a, b) {
    const m = a.length, n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i-1] === b[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    
    // Backtrack
    const lcs = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (a[i-1] === b[j-1]) {
            lcs.unshift(a[i-1]);
            i--; j--;
        } else if (dp[i-1][j] > dp[i][j-1]) {
            i--;
        } else {
            j--;
        }
    }
    return lcs;
}

function similarity(a, b) {
    if (!a || !b) return 0;
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return intersection / union;
}

function renderDiff() {
    if (!diffData) return;
    
    const container = document.getElementById('diffResult');
    
    if (diffData.stats.added === 0 && diffData.stats.removed === 0 && diffData.stats.changed === 0) {
        container.innerHTML = '<div class="no-diff">✓ テキストは同一です</div>';
        return;
    }
    
    if (currentView === 'unified') {
        renderUnified(container);
    } else if (currentView === 'side') {
        renderSideBySide(container);
    } else {
        renderInline(container);
    }
}

function renderUnified(container) {
    let html = '<div class="diff-view">';
    
    diffData.diff.forEach(d => {
        if (d.type === 'same') {
            html += `<div class="diff-line">
                <span class="line-num">${d.oldLine}</span>
                <span class="line-content">${escapeHtml(d.content)}</span>
            </div>`;
        } else if (d.type === 'remove') {
            html += `<div class="diff-line diff-remove">
                <span class="line-num">-${d.oldLine}</span>
                <span class="line-content">${escapeHtml(d.content)}</span>
            </div>`;
        } else if (d.type === 'add') {
            html += `<div class="diff-line diff-add">
                <span class="line-num">+${d.newLine}</span>
                <span class="line-content">${escapeHtml(d.content)}</span>
            </div>`;
        } else if (d.type === 'change') {
            html += `<div class="diff-line diff-remove">
                <span class="line-num">-${d.oldLine}</span>
                <span class="line-content">${escapeHtml(d.oldContent)}</span>
            </div>`;
            html += `<div class="diff-line diff-add">
                <span class="line-num">+${d.newLine}</span>
                <span class="line-content">${escapeHtml(d.newContent)}</span>
            </div>`;
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderSideBySide(container) {
    let leftHtml = '', rightHtml = '';
    
    diffData.diff.forEach(d => {
        if (d.type === 'same') {
            leftHtml += `<div class="diff-line"><span class="line-num">${d.oldLine}</span><span class="line-content">${escapeHtml(d.content)}</span></div>`;
            rightHtml += `<div class="diff-line"><span class="line-num">${d.newLine}</span><span class="line-content">${escapeHtml(d.content)}</span></div>`;
        } else if (d.type === 'remove') {
            leftHtml += `<div class="diff-line diff-remove"><span class="line-num">${d.oldLine}</span><span class="line-content">${escapeHtml(d.content)}</span></div>`;
            rightHtml += `<div class="diff-line"><span class="line-num"></span><span class="line-content"></span></div>`;
        } else if (d.type === 'add') {
            leftHtml += `<div class="diff-line"><span class="line-num"></span><span class="line-content"></span></div>`;
            rightHtml += `<div class="diff-line diff-add"><span class="line-num">${d.newLine}</span><span class="line-content">${escapeHtml(d.content)}</span></div>`;
        } else if (d.type === 'change') {
            leftHtml += `<div class="diff-line diff-change"><span class="line-num">${d.oldLine}</span><span class="line-content">${escapeHtml(d.oldContent)}</span></div>`;
            rightHtml += `<div class="diff-line diff-change"><span class="line-num">${d.newLine}</span><span class="line-content">${escapeHtml(d.newContent)}</span></div>`;
        }
    });
    
    container.innerHTML = `
        <div class="side-by-side">
            <div class="side-panel">
                <h4>オリジナル</h4>
                <div class="diff-view" style="max-height:none">${leftHtml}</div>
            </div>
            <div class="side-panel">
                <h4>変更後</h4>
                <div class="diff-view" style="max-height:none">${rightHtml}</div>
            </div>
        </div>
    `;
}

function renderInline(container) {
    let html = '<div class="diff-view">';
    
    diffData.diff.forEach(d => {
        if (d.type === 'same') {
            html += `<div class="diff-line"><span class="line-num">${d.oldLine}</span><span class="line-content">${escapeHtml(d.content)}</span></div>`;
        } else if (d.type === 'remove') {
            html += `<div class="diff-line"><span class="line-num">${d.oldLine}</span><span class="line-content"><span class="inline-remove">${escapeHtml(d.content)}</span></span></div>`;
        } else if (d.type === 'add') {
            html += `<div class="diff-line"><span class="line-num">${d.newLine}</span><span class="line-content"><span class="inline-add">${escapeHtml(d.content)}</span></span></div>`;
        } else if (d.type === 'change') {
            const inlineDiff = getInlineDiff(d.oldContent, d.newContent);
            html += `<div class="diff-line"><span class="line-num">${d.oldLine}→${d.newLine}</span><span class="line-content">${inlineDiff}</span></div>`;
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function getInlineDiff(oldStr, newStr) {
    // Simple word-level diff
    const oldWords = oldStr.split(/(\s+)/);
    const newWords = newStr.split(/(\s+)/);
    let result = '';
    
    const lcs = computeLCS(oldWords, newWords);
    let oldIdx = 0, newIdx = 0, lcsIdx = 0;
    
    while (oldIdx < oldWords.length || newIdx < newWords.length) {
        if (lcsIdx < lcs.length && oldIdx < oldWords.length && newIdx < newWords.length &&
            oldWords[oldIdx] === lcs[lcsIdx] && newWords[newIdx] === lcs[lcsIdx]) {
            result += escapeHtml(oldWords[oldIdx]);
            oldIdx++; newIdx++; lcsIdx++;
        } else if (newIdx >= newWords.length || 
                  (oldIdx < oldWords.length && (lcsIdx >= lcs.length || oldWords[oldIdx] !== lcs[lcsIdx]))) {
            result += `<span class="inline-remove">${escapeHtml(oldWords[oldIdx])}</span>`;
            oldIdx++;
        } else {
            result += `<span class="inline-add">${escapeHtml(newWords[newIdx])}</span>`;
            newIdx++;
        }
    }
    
    return result;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderDiff();
}

function swapTexts() {
    const oldText = document.getElementById('oldText');
    const newText = document.getElementById('newText');
    const temp = oldText.value;
    oldText.value = newText.value;
    newText.value = temp;
}

function clearAll() {
    document.getElementById('oldText').value = '';
    document.getElementById('newText').value = '';
    document.getElementById('statsBar').style.display = 'none';
    document.getElementById('resultPanel').style.display = 'none';
    diffData = null;
}

function loadSample() {
    document.getElementById('oldText').value = `function greet(name) {
    console.log("Hello, " + name);
    return true;
}

const users = ["Alice", "Bob"];
users.forEach(greet);`;

    document.getElementById('newText').value = `function greet(name, greeting = "Hello") {
    console.log(greeting + ", " + name + "!");
    return true;
}

const users = ["Alice", "Bob", "Charlie"];
users.forEach(user => greet(user, "Hi"));`;
    
    compare();
}
