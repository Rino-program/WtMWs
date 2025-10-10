/**
 * バーチャル水族館ゲーム - 段階的開発ガイド
 * ナビゲーションスクリプト
 */

// DOMコンテンツ読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeProgressBar();
    initializePhaseButtons();
});

/**
 * ナビゲーションの初期化
 */
function initializeNavigation() {
    // 現在のページに基づいてアクティブなフェーズボタンを設定
    const currentPage = getCurrentPage();
    setActivePhase(currentPage);
}

/**
 * 現在のページを取得
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    
    if (filename === '' || filename === 'index.html') {
        return 'overview';
    } else if (filename.startsWith('phase')) {
        return filename.replace('.html', '');
    } else if (filename === 'bugfix.html') {
        return 'bugfix';
    }
    
    return 'overview';
}

/**
 * アクティブなフェーズを設定
 */
function setActivePhase(phase) {
    const buttons = document.querySelectorAll('.phase-btn');
    buttons.forEach(btn => {
        if (btn.dataset.phase === phase) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * プログレスバーの初期化
 */
function initializeProgressBar() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateProgressBar();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // 初期状態を設定
    updateProgressBar();
}

/**
 * プログレスバーの更新
 */
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
    progressBar.style.width = `${Math.min(scrollPercentage, 100)}%`;
}

/**
 * フェーズボタンの初期化
 */
function initializePhaseButtons() {
    const phaseButtons = document.querySelectorAll('.phase-btn');
    
    phaseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const phase = btn.dataset.phase;
            navigateToPhase(phase);
        });
    });
}

/**
 * フェーズページへのナビゲーション
 */
function navigateToPhase(phase) {
    const pageMap = {
        'overview': './index.html',
        'phase0': './phase0.html',
        'phase1': './phase1.html',
        'phase2': './phase2.html',
        'phase3': './phase3.html',
        'phase4': './phase4.html',
        'phase5': './phase5.html',
        'bugfix': './bugfix.html'
    };
    const targetPage = pageMap[phase];
    if (targetPage) {
        window.location.href = targetPage;
    }
}

/**
 * スムーズスクロール
 */
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * ローカルストレージにチェックリストの状態を保存
 */
function saveChecklistState(phase, item, checked) {
    const key = `checklist_${phase}`;
    let state = JSON.parse(localStorage.getItem(key) || '{}');
    state[item] = checked;
    localStorage.setItem(key, JSON.stringify(state));
}

/**
 * ローカルストレージからチェックリストの状態を読み込み
 */
function loadChecklistState(phase) {
    const key = `checklist_${phase}`;
    return JSON.parse(localStorage.getItem(key) || '{}');
}

/**
 * チェックリストの初期化
 */
function initializeChecklist(phase) {
    const checklistItems = document.querySelectorAll('.checklist li');
    const state = loadChecklistState(phase);
    
    checklistItems.forEach((item, index) => {
        const itemId = `item_${index}`;
        
        // 保存された状態を適用
        if (state[itemId]) {
            item.classList.add('completed');
        }
        
        // クリックイベントを追加
        item.addEventListener('click', () => {
            item.classList.toggle('completed');
            const isCompleted = item.classList.contains('completed');
            saveChecklistState(phase, itemId, isCompleted);
        });
    });
}

/**
 * コードブロックのコピー機能
 */
function initializeCodeCopy() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.textContent = 'コピー';
        button.addEventListener('click', () => {
            copyToClipboard(block.textContent);
            button.textContent = 'コピーしました！';
            setTimeout(() => {
                button.textContent = 'コピー';
            }, 2000);
        });
        
        block.parentElement.style.position = 'relative';
        block.parentElement.appendChild(button);
    });
}

/**
 * クリップボードにコピー
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        // フォールバック
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

/**
 * TOC（目次）の自動生成
 */
function generateTOC() {
    const tocContainer = document.getElementById('toc');
    if (!tocContainer) return;
    
    const headings = document.querySelectorAll('.content-card h3, .content-card h4');
    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = heading.textContent;
        link.className = heading.tagName === 'H3' ? 'toc-main' : 'toc-sub';
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScroll(`#${id}`);
        });
        
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });
    
    tocContainer.appendChild(tocList);
}

/**
 * キーボードショートカット
 */
document.addEventListener('keydown', (e) => {
    // Ctrl+左矢印: 前のフェーズ
    if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToPreviousPhase();
    }
    
    // Ctrl+右矢印: 次のフェーズ
    if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToNextPhase();
    }
    
    // Ctrl+H: ホームに戻る
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = 'index.html';
    }
});

/**
 * 前のフェーズへナビゲート
 */
function navigateToPreviousPhase() {
    const phases = ['overview', 'phase0', 'phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'bugfix'];
    const currentPhase = getCurrentPage();
    const currentIndex = phases.indexOf(currentPhase);
    
    if (currentIndex > 0) {
        navigateToPhase(phases[currentIndex - 1]);
    }
}

/**
 * 次のフェーズへナビゲート
 */
function navigateToNextPhase() {
    const phases = ['overview', 'phase0', 'phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'bugfix'];
    const currentPhase = getCurrentPage();
    const currentIndex = phases.indexOf(currentPhase);
    
    if (currentIndex < phases.length - 1) {
        navigateToPhase(phases[currentIndex + 1]);
    }
}

/**
 * アクセシビリティ機能
 */
function initializeAccessibility() {
    // フォーカス可能な要素にフォーカスインジケーターを追加
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select');
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', () => {
            element.style.outline = '2px solid var(--primary-color)';
            element.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', () => {
            element.style.outline = '';
            element.style.outlineOffset = '';
        });
    });
}

// エクスポート（他のスクリプトで使用する場合）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeNavigation,
        initializeProgressBar,
        smoothScroll,
        saveChecklistState,
        loadChecklistState,
        initializeChecklist,
        generateTOC
    };
}
