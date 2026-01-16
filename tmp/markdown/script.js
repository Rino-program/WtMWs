const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const STORAGE_KEY = 'md_editor_content';

// Load saved content
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
    editor.value = saved;
} else {
    editor.value = `# マークダウンエディタへようこそ！

これはリアルタイムプレビュー付きのマークダウンエディタです。

## 機能

- **太字** と *斜体* のテキスト
- ~~取り消し線~~
- \`インラインコード\`
- [リンク](https://example.com)

### コードブロック

\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

### リスト

1. 番号付きリスト
2. 項目2
3. 項目3

- 箇条書きリスト
- 項目A
- 項目B

### タスクリスト

- [x] 完了したタスク
- [ ] 未完了のタスク

### 引用

> これは引用文です。
> 複数行にわたることもできます。

### 表

| 名前 | 年齢 | 職業 |
|------|------|------|
| 田中 | 30 | エンジニア |
| 佐藤 | 25 | デザイナー |

---

楽しんでください！ 🎉`;
}

// Markdown parser
function parseMarkdown(text) {
    let html = text;
    
    // Escape HTML
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Code blocks (must be first to prevent inner parsing)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Horizontal rule
    html = html.replace(/^---+$/gm, '<hr>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Links and images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');
    
    // Task lists
    html = html.replace(/^- \[x\] (.+)$/gm, '<li class="task-list-item"><input type="checkbox" checked disabled>$1</li>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<li class="task-list-item"><input type="checkbox" disabled>$1</li>');
    
    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
    html = html.replace(/(<oli>.*<\/oli>\n?)+/g, (match) => {
        return '<ol>' + match.replace(/<\/?oli>/g, (tag) => tag === '<oli>' ? '<li>' : '</li>') + '</ol>';
    });
    
    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split('|').map(c => c.trim());
        if (cells.every(c => /^[-:]+$/.test(c))) {
            return '<tr class="table-sep"></tr>';
        }
        const isHeader = cells.some(c => c.startsWith('**'));
        const tag = isHeader ? 'th' : 'td';
        return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>');
    html = html.replace(/<tr class="table-sep"><\/tr>/g, '');
    
    // Paragraphs
    html = html.split('\n\n').map(block => {
        if (block.match(/^<(h[1-6]|ul|ol|pre|blockquote|table|hr)/)) {
            return block;
        }
        return block.split('\n').filter(line => line.trim()).map(line => {
            if (line.match(/^<(h[1-6]|ul|ol|pre|blockquote|li|table|tr|hr)/)) {
                return line;
            }
            return `<p>${line}</p>`;
        }).join('\n');
    }).join('\n');
    
    return html;
}

function updatePreview() {
    preview.innerHTML = parseMarkdown(editor.value);
    localStorage.setItem(STORAGE_KEY, editor.value);
    updateStats();
}

function updateStats() {
    const text = editor.value;
    const chars = text.length;
    const lines = text.split('\n').length;
    const words = text.trim().split(/\s+/).filter(w => w).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    
    document.getElementById('stats').textContent = `${chars}文字 / ${lines}行`;
    document.getElementById('readTime').textContent = `約${readTime}分で読めます`;
}

// Toolbar functions
function insertMd(before, after) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selected = text.substring(start, end);
    
    editor.value = text.substring(0, start) + before + selected + after + text.substring(end);
    editor.focus();
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + selected.length;
    updatePreview();
}

function insertLine(prefix) {
    const start = editor.selectionStart;
    const text = editor.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    
    editor.value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    editor.focus();
    editor.selectionStart = editor.selectionEnd = lineStart + prefix.length;
    updatePreview();
}

function insertCodeBlock() {
    insertMd('```\n', '\n```');
}

function insertTable() {
    const table = `| 列1 | 列2 | 列3 |
|------|------|------|
| データ | データ | データ |`;
    const start = editor.selectionStart;
    editor.value = editor.value.substring(0, start) + '\n' + table + '\n' + editor.value.substring(start);
    editor.focus();
    updatePreview();
}

// Export functions
function toggleExport() {
    document.getElementById('exportDropdown').classList.toggle('show');
}

function exportMd() {
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    downloadBlob(blob, 'document.md');
    toggleExport();
}

function exportHtml() {
    const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Document</title>
    <style>
        body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;line-height:1.8;color:#333}
        h1,h2,h3{margin-top:1.5em}
        h1{border-bottom:2px solid #eee;padding-bottom:0.3em}
        h2{border-bottom:1px solid #eee;padding-bottom:0.2em}
        code{background:#f4f4f4;padding:2px 6px;border-radius:4px}
        pre{background:#f4f4f4;padding:15px;border-radius:8px;overflow-x:auto}
        pre code{background:none;padding:0}
        blockquote{border-left:4px solid #ddd;padding-left:15px;color:#666;font-style:italic}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ddd;padding:10px}
        th{background:#f4f4f4}
        img{max-width:100%}
    </style>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    downloadBlob(blob, 'document.html');
    toggleExport();
}

function copyHtml() {
    navigator.clipboard.writeText(preview.innerHTML).then(() => {
        showToast('HTMLをコピーしました！');
    });
    toggleExport();
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// View toggle (mobile)
function setView(mode) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    const editorPane = document.getElementById('editorPane');
    const previewPane = document.getElementById('previewPane');
    const divider = document.getElementById('divider');
    
    if (mode === 'editor') {
        editorPane.style.display = 'flex';
        previewPane.style.display = 'none';
        divider.style.display = 'none';
    } else if (mode === 'preview') {
        editorPane.style.display = 'none';
        previewPane.style.display = 'flex';
        divider.style.display = 'none';
    } else {
        editorPane.style.display = 'flex';
        previewPane.style.display = 'flex';
        divider.style.display = 'block';
    }
}

// Resizable divider
const divider = document.getElementById('divider');
let isResizing = false;

divider.addEventListener('mousedown', () => isResizing = true);
document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const container = document.querySelector('.main-area');
    const rect = container.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    document.getElementById('editorPane').style.flex = `0 0 ${percent}%`;
    document.getElementById('previewPane').style.flex = `0 0 ${100 - percent}%`;
});
document.addEventListener('mouseup', () => isResizing = false);

// Close export dropdown on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.export-menu')) {
        document.getElementById('exportDropdown').classList.remove('show');
    }
});

// Keyboard shortcuts
editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') { e.preventDefault(); insertMd('**', '**'); }
        if (e.key === 'i') { e.preventDefault(); insertMd('*', '*'); }
        if (e.key === 'k') { e.preventDefault(); insertMd('[', '](url)'); }
    }
    // Tab for indentation
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(start);
        editor.selectionStart = editor.selectionEnd = start + 4;
        updatePreview();
    }
});

editor.addEventListener('input', updatePreview);
updatePreview();
