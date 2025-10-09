/**
 * バーチャル水族館ゲーム設計ドキュメント
 * インタラクティブ機能
 */

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeTableOfContents();
    initializeSearch();
    initializeScrollSpy();
    initializeCollapsibleSections();
});

/**
 * 目次の動的生成
 */
function initializeTableOfContents() {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;

    // 全てのh2見出しを取得
    const sections = document.querySelectorAll('.doc-section');
    
    sections.forEach((section, index) => {
        const heading = section.querySelector('h2');
        if (!heading) return;

        const sectionId = section.id || `section-${index}`;
        section.id = sectionId;

        // 目次項目を作成
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${sectionId}`;
        a.textContent = heading.textContent;
        a.className = 'toc-link';
        
        // クリックイベント
        a.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScrollTo(sectionId);
            
            // アクティブ状態を更新
            document.querySelectorAll('.toc-link').forEach(link => {
                link.classList.remove('active');
            });
            a.classList.add('active');
        });

        li.appendChild(a);

        // サブセクション（h3）があれば追加
        const subheadings = section.querySelectorAll('h3');
        if (subheadings.length > 0) {
            a.classList.add('has-subsection');
            const subList = document.createElement('ul');
            subList.className = 'subsection';
            
            subheadings.forEach((subheading, subIndex) => {
                const subId = `${sectionId}-sub-${subIndex}`;
                subheading.id = subId;
                
                const subLi = document.createElement('li');
                const subA = document.createElement('a');
                subA.href = `#${subId}`;
                subA.textContent = subheading.textContent;
                subA.className = 'toc-link';
                
                subA.addEventListener('click', (e) => {
                    e.preventDefault();
                    smoothScrollTo(subId);
                });
                
                subLi.appendChild(subA);
                subList.appendChild(subLi);
            });
            
            li.appendChild(subList);
            
            // 折りたたみ機能
            a.addEventListener('click', (e) => {
                if (e.target.classList.contains('has-subsection')) {
                    e.target.classList.toggle('expanded');
                    subList.classList.toggle('expanded');
                }
            });
        }

        tocList.appendChild(li);
    });
}

/**
 * スムーズスクロール
 */
function smoothScrollTo(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const yOffset = -100; // ヘッダーの高さ分オフセット
    const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({
        top: y,
        behavior: 'smooth'
    });
}

/**
 * 検索機能
 */
function initializeSearch() {
    const searchBox = document.getElementById('search-box');
    if (!searchBox) return;

    let searchTimeout;

    searchBox.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300); // デバウンス: 300ms
    });
}

/**
 * 検索を実行
 */
function performSearch(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // クエリが空の場合は全て表示
    if (!normalizedQuery) {
        showAllSections();
        removeHighlights();
        return;
    }

    // 全セクションを検索
    const sections = document.querySelectorAll('.doc-section');
    let matchCount = 0;

    sections.forEach(section => {
        const text = section.textContent.toLowerCase();
        const heading = section.querySelector('h2');
        
        if (text.includes(normalizedQuery)) {
            section.style.display = 'block';
            matchCount++;
            
            // 見出しをハイライト
            if (heading && heading.textContent.toLowerCase().includes(normalizedQuery)) {
                highlightText(heading, normalizedQuery);
            }
        } else {
            section.style.display = 'none';
        }
    });

    // 結果表示
    updateSearchResults(matchCount, normalizedQuery);
}

/**
 * 全セクションを表示
 */
function showAllSections() {
    const sections = document.querySelectorAll('.doc-section');
    sections.forEach(section => {
        section.style.display = 'block';
    });
}

/**
 * ハイライトを削除
 */
function removeHighlights() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

/**
 * テキストをハイライト
 */
function highlightText(element, query) {
    // 既存のハイライトを削除
    const originalText = element.textContent;
    element.innerHTML = originalText;

    if (!query) return;

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const newHTML = element.innerHTML.replace(regex, '<mark class="search-highlight">$1</mark>');
    element.innerHTML = newHTML;
}

/**
 * 正規表現の特殊文字をエスケープ
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 検索結果の表示更新
 */
function updateSearchResults(count, query) {
    // 既存の結果表示を削除
    const existingResult = document.querySelector('.search-result');
    if (existingResult) {
        existingResult.remove();
    }

    // 新しい結果を表示
    if (query) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.style.cssText = `
            background: #fef3c7;
            padding: 12px 20px;
            text-align: center;
            color: #92400e;
            font-weight: 500;
        `;
        resultDiv.textContent = count > 0 
            ? `"${query}" に一致する項目: ${count}件` 
            : `"${query}" に一致する項目はありません`;

        const searchBar = document.querySelector('.search-bar .container');
        searchBar.appendChild(resultDiv);
    }
}

/**
 * スクロールスパイ（現在表示中のセクションをハイライト）
 */
function initializeScrollSpy() {
    const sections = document.querySelectorAll('.doc-section');
    const tocLinks = document.querySelectorAll('.toc-link');

    if (sections.length === 0 || tocLinks.length === 0) return;

    // スクロールイベント（スロットリング付き）
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                updateActiveSection(sections, tocLinks);
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // 初期状態を設定
    updateActiveSection(sections, tocLinks);
}

/**
 * アクティブセクションの更新
 */
function updateActiveSection(sections, tocLinks) {
    const scrollPosition = window.scrollY + 150;

    let currentSectionId = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSectionId = section.id;
        }
    });

    // 目次のアクティブ状態を更新
    tocLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${currentSectionId}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * 折りたたみ可能なセクション
 */
function initializeCollapsibleSections() {
    const hasSubsectionLinks = document.querySelectorAll('.has-subsection');
    
    hasSubsectionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const subsection = link.parentElement.querySelector('.subsection');
            if (subsection) {
                // アコーディオン動作
                e.preventDefault();
                link.classList.toggle('expanded');
                subsection.classList.toggle('expanded');
            }
        });
    });
}

/**
 * キーボードショートカット
 */
document.addEventListener('keydown', (e) => {
    // Ctrl + K または Cmd + K で検索フォーカス
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchBox = document.getElementById('search-box');
        if (searchBox) {
            searchBox.focus();
            searchBox.select();
        }
    }

    // Escapeで検索をクリア
    if (e.key === 'Escape') {
        const searchBox = document.getElementById('search-box');
        if (searchBox && searchBox.value) {
            searchBox.value = '';
            performSearch('');
        }
    }
});

/**
 * ページロード時のアンカーへのスクロール
 */
window.addEventListener('load', () => {
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        setTimeout(() => {
            smoothScrollTo(targetId);
        }, 100);
    }
});

// デバッグ用（開発環境のみ）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🐠 バーチャル水族館ゲーム設計ドキュメント - JavaScript読み込み完了');
    console.log('💡 Ctrl+K / Cmd+K で検索ボックスにフォーカス');
    console.log('💡 Escキーで検索をクリア');
}
