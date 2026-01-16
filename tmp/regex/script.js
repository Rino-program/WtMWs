const patternInput = document.getElementById('regexPattern');
const flagsInput = document.getElementById('regexFlags');
const testArea = document.getElementById('testArea');
const errorMsg = document.getElementById('errorMsg');
const matchesList = document.getElementById('matchesList');

let originalText = testArea.innerText;

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

function updateMatches() {
    const pattern = patternInput.value;
    const flags = flagsInput.value;
    
    // Get plain text
    const text = testArea.innerText;
    originalText = text;
    
    if (!pattern) {
        testArea.innerHTML = escapeHtml(text);
        matchesList.innerHTML = '<p style="color:rgba(255,255,255,0.5);font-size:0.9rem">パターンを入力してください</p>';
        updateStats(0, 0, 0);
        return;
    }

    try {
        const startTime = performance.now();
        const regex = new RegExp(pattern, flags);
        errorMsg.classList.remove('show');

        const matches = [];
        let match;
        let lastIndex = 0;
        let highlighted = '';
        
        if (flags.includes('g')) {
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.slice(1)
                });
                
                highlighted += escapeHtml(text.slice(lastIndex, match.index));
                highlighted += `<span class="match">${escapeHtml(match[0])}</span>`;
                lastIndex = match.index + match[0].length;
                
                if (match[0].length === 0) regex.lastIndex++;
            }
            highlighted += escapeHtml(text.slice(lastIndex));
        } else {
            match = regex.exec(text);
            if (match) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.slice(1)
                });
                highlighted = escapeHtml(text.slice(0, match.index));
                highlighted += `<span class="match">${escapeHtml(match[0])}</span>`;
                highlighted += escapeHtml(text.slice(match.index + match[0].length));
            } else {
                highlighted = escapeHtml(text);
            }
        }

        const endTime = performance.now();
        
        testArea.innerHTML = highlighted;
        renderMatches(matches);
        
        const groupCount = pattern.match(/\((?!\?)/g)?.length || 0;
        updateStats(matches.length, groupCount, endTime - startTime);
        
    } catch (e) {
        errorMsg.textContent = '❌ ' + e.message;
        errorMsg.classList.add('show');
        testArea.innerHTML = escapeHtml(text);
        matchesList.innerHTML = '';
        updateStats(0, 0, 0);
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMatches(matches) {
    if (matches.length === 0) {
        matchesList.innerHTML = '<p style="color:rgba(255,255,255,0.5);font-size:0.9rem">マッチなし</p>';
        document.getElementById('matchCount').textContent = '0件';
        return;
    }

    document.getElementById('matchCount').textContent = matches.length + '件';
    
    matchesList.innerHTML = matches.map((m, i) => `
        <div class="match-item">
            <div class="match-header">
                <span>マッチ ${i + 1}</span>
                <span>位置: ${m.index}</span>
            </div>
            <div class="match-text">${escapeHtml(m.text)}</div>
            ${m.groups.length > 0 ? `
                <div class="match-groups">
                    ${m.groups.map((g, gi) => `
                        <div class="group-item">
                            <span class="group-label">$${gi + 1}:</span>
                            <span>${g ? escapeHtml(g) : '<em style="color:rgba(255,255,255,0.3)">空</em>'}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function updateStats(matches, groups, time) {
    document.getElementById('totalMatches').textContent = matches;
    document.getElementById('totalGroups').textContent = groups;
    document.getElementById('execTime').textContent = time.toFixed(2) + 'ms';
}

function setPreset(pattern, flags) {
    patternInput.value = pattern;
    flagsInput.value = flags;
    updateMatches();
}

function performReplace() {
    const pattern = patternInput.value;
    const flags = flagsInput.value;
    const replacement = document.getElementById('replacePattern').value;
    const resultDiv = document.getElementById('replaceResult');

    if (!pattern) {
        resultDiv.textContent = 'パターンを入力してください';
        resultDiv.classList.add('show');
        return;
    }

    try {
        const regex = new RegExp(pattern, flags);
        const result = originalText.replace(regex, replacement);
        resultDiv.textContent = result;
        resultDiv.classList.add('show');
    } catch (e) {
        resultDiv.textContent = 'エラー: ' + e.message;
        resultDiv.classList.add('show');
    }
}

// Preserve cursor position on contenteditable
testArea.addEventListener('input', debounce(() => {
    originalText = testArea.innerText;
    updateMatches();
}, 300));

patternInput.addEventListener('input', debounce(updateMatches, 200));
flagsInput.addEventListener('input', debounce(updateMatches, 200));

// Initial run
updateMatches();
