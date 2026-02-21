// ==================== DOMContentLoaded ====================
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initSearch();
    initScrollTopButton();
    initMobileMenu();
    initSmoothScroll();
});

// ==================== ナビゲーション ====================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.category-section');
    
    // ナビゲーションアイテムのクリックイベント
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const targetSection = document.getElementById(category);
            
            if (targetSection) {
                // アクティブ状態の更新
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                
                // スムーススクロール
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 10;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // モバイルの場合はメニューを閉じる
                if (window.innerWidth <= 768) {
                    const sidebar = document.querySelector('.sidebar');
                    sidebar.classList.remove('show');
                }
            }
        });
    });
    
    // スクロールに応じてアクティブなセクションをハイライト
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateActiveNav();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// アクティブなナビゲーションを更新
function updateActiveNav() {
    const sections = document.querySelectorAll('.category-section');
    const navItems = document.querySelectorAll('.nav-item');
    const headerHeight = document.querySelector('.header').offsetHeight;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 50;
        const sectionBottom = sectionTop + section.offsetHeight;
        const scrollPosition = window.pageYOffset;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-category') === currentSection) {
            item.classList.add('active');
        }
    });
}

// ==================== 検索機能 ====================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            // 検索キーワードが空の場合、全て表示
            showAllItems();
        } else {
            // 検索実行
            performSearch(searchTerm);
        }
    });
}

// 検索実行
function performSearch(searchTerm) {
    const functionCards = document.querySelectorAll('.function-card');
    const categorySections = document.querySelectorAll('.category-section');
    
    let hasVisibleCards = {};
    
    // 各カテゴリーセクションの表示状態を初期化
    categorySections.forEach(section => {
        const sectionId = section.getAttribute('id');
        hasVisibleCards[sectionId] = false;
    });
    
    // 各関数カードをチェック
    functionCards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.description')?.textContent.toLowerCase() || '';
        const codeBlock = card.querySelector('.code-block code')?.textContent.toLowerCase() || '';
        const usage = card.querySelector('.usage')?.textContent.toLowerCase() || '';
        
        // 検索キーワードがいずれかに含まれるかチェック
        if (title.includes(searchTerm) || 
            description.includes(searchTerm) || 
            codeBlock.includes(searchTerm) ||
            usage.includes(searchTerm)) {
            card.classList.remove('hidden');
            
            // このカードが属するセクションを表示対象にする
            const section = card.closest('.category-section');
            if (section) {
                const sectionId = section.getAttribute('id');
                hasVisibleCards[sectionId] = true;
            }
        } else {
            card.classList.add('hidden');
        }
    });
    
    // カテゴリーセクションの表示/非表示を更新
    categorySections.forEach(section => {
        const sectionId = section.getAttribute('id');
        if (hasVisibleCards[sectionId]) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

// 全てのアイテムを表示
function showAllItems() {
    const functionCards = document.querySelectorAll('.function-card');
    const categorySections = document.querySelectorAll('.category-section');
    
    functionCards.forEach(card => {
        card.classList.remove('hidden');
    });
    
    categorySections.forEach(section => {
        section.classList.remove('hidden');
    });
}

// ==================== スクロールトップボタン ====================
function initScrollTopButton() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    // スクロール時のボタン表示/非表示
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    // ボタンクリック時のスクロール
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==================== モバイルメニュー ====================
function initMobileMenu() {
    // モバイルメニューボタンを動的に作成
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '☰';
    mobileMenuBtn.setAttribute('aria-label', 'メニューを開く');
    document.body.appendChild(mobileMenuBtn);
    
    const sidebar = document.querySelector('.sidebar');
    
    // メニューボタンクリック
    mobileMenuBtn.addEventListener('click', function() {
        sidebar.classList.toggle('show');
        
        // アイコンの変更
        if (sidebar.classList.contains('show')) {
            this.innerHTML = '✕';
            this.setAttribute('aria-label', 'メニューを閉じる');
        } else {
            this.innerHTML = '☰';
            this.setAttribute('aria-label', 'メニューを開く');
        }
    });
    
    // サイドバー外をクリックしたら閉じる
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && 
                !mobileMenuBtn.contains(e.target) && 
                sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
                mobileMenuBtn.innerHTML = '☰';
                mobileMenuBtn.setAttribute('aria-label', 'メニューを開く');
            }
        }
    });
    
    // ウィンドウサイズ変更時の処理
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('show');
                mobileMenuBtn.innerHTML = '☰';
            }
        }, 250);
    });
}

// ==================== スムーススクロール ====================
function initSmoothScroll() {
    // ページ内リンクのスムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 10;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ==================== ユーティリティ関数 ====================

// デバウンス関数（検索などで使用）
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// スロットル関数（スクロールイベントで使用）
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== キーボードショートカット ====================
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K で検索フォーカス
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        searchInput.focus();
        searchInput.select();
    }
    
    // Escapeキーで検索クリア
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (document.activeElement === searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
        }
        
        // モバイルメニューも閉じる
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            if (sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
                mobileMenuBtn.innerHTML = '☰';
                mobileMenuBtn.setAttribute('aria-label', 'メニューを開く');
            }
        }
    }
});

// ==================== ローカルストレージ（将来の拡張用） ====================

// 最後に見たセクションを保存
function saveLastViewedSection(sectionId) {
    try {
        localStorage.setItem('lastViewedSection', sectionId);
    } catch (e) {
        console.warn('LocalStorage not available:', e);
    }
}

// 最後に見たセクションを読み込み
function loadLastViewedSection() {
    try {
        return localStorage.getItem('lastViewedSection');
    } catch (e) {
        console.warn('LocalStorage not available:', e);
        return null;
    }
}

// ページロード時に最後のセクションに移動（オプション）
window.addEventListener('load', function() {
    const lastSection = loadLastViewedSection();
    if (lastSection && !window.location.hash) {
        const targetElement = document.getElementById(lastSection);
        if (targetElement) {
            setTimeout(() => {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 10;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
});

// ==================== コードブロックのコピー機能（将来の拡張用） ====================

// 各コードブロックにコピーボタンを追加する関数
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('.code-block');
    
    codeBlocks.forEach((block, index) => {
        // コピーボタンを作成
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋 コピー';
        copyBtn.setAttribute('aria-label', 'コードをコピー');
        
        // ボタンのスタイル（インライン）
        copyBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        // コードブロックの親要素にrelative positionを追加
        block.style.position = 'relative';
        
        // マウスオーバーでボタンを表示
        block.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
        });
        
        block.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0';
        });
        
        // クリックでコピー
        copyBtn.addEventListener('click', async function() {
            const code = block.querySelector('code').textContent;
            
            try {
                await navigator.clipboard.writeText(code);
                copyBtn.innerHTML = '✓ コピーしました';
                copyBtn.style.backgroundColor = '#2ecc71';
                
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 コピー';
                    copyBtn.style.backgroundColor = '#3498db';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                copyBtn.innerHTML = '✕ 失敗';
                copyBtn.style.backgroundColor = '#e74c3c';
                
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 コピー';
                    copyBtn.style.backgroundColor = '#3498db';
                }, 2000);
            }
        });
        
        block.appendChild(copyBtn);
    });
}

// ページロード後にコピーボタンを追加
window.addEventListener('load', addCopyButtons);

// ==================== パフォーマンス最適化 ====================

// Intersection Observer APIを使った遅延表示（将来の拡張用）
function initLazyLoad() {
    const cards = document.querySelectorAll('.function-card');
    
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    cards.forEach(card => {
        observer.observe(card);
    });
}

// ==================== アクセシビリティ強化 ====================

// フォーカス管理
function initAccessibility() {
    // タブキーでのフォーカス移動を視覚的に分かりやすく
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('using-keyboard');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('using-keyboard');
    });
}

// ページロード時に初期化
window.addEventListener('load', function() {
    initAccessibility();
});

// ==================== エクスポート機能（将来の拡張用） ====================

// ページ全体をMarkdownとしてエクスポート
function exportToMarkdown() {
    let markdown = '# AtCoder Template v2 仕様書\n\n';
    
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        const title = section.querySelector('h2').textContent;
        markdown += `## ${title}\n\n`;
        
        const cards = section.querySelectorAll('.function-card');
        cards.forEach(card => {
            const funcName = card.querySelector('h3')?.textContent || '';
            const description = card.querySelector('.description')?.textContent || '';
            const code = card.querySelector('.code-block code')?.textContent || '';
            
            markdown += `### ${funcName}\n\n`;
            markdown += `${description}\n\n`;
            markdown += '```python\n';
            markdown += code;
            markdown += '\n```\n\n';
        });
    });
    
    return markdown;
}

// PDFとしてエクスポート（ブラウザの印刷機能を使用）
function exportToPDF() {
    window.print();
}

// ==================== コンソールメッセージ ====================
console.log('%c AtCoder Template 仕様書 ', 'background: #3498db; color: white; font-size: 16px; padding: 5px 10px; border-radius: 5px;');
console.log('キーボードショートカット:');
console.log('  Ctrl/Cmd + K : 検索フォーカス');
console.log('  Escape      : 検索クリア / メニューを閉じる');
console.log('\nバージョン: 2.0');
console.log('対応環境: PyPy 7.3.20 / Python 3.11');