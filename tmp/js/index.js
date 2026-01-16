/**
 * Creative Lab - Index JavaScript
 * お気に入り機能・ダークモード・検索・フィルター・ソート
 */

// ================================
// 状態管理
// ================================
const state = {
    favorites: JSON.parse(localStorage.getItem('creativeLab_favorites') || '[]'),
    theme: localStorage.getItem('creativeLab_theme') || 'dark',
    showFavoritesOnly: false,
    currentFilter: 'all',
    currentSort: 'default',
    searchQuery: ''
};

// ================================
// 初期化
// ================================
document.addEventListener('DOMContentLoaded', () => {
    initStars();
    initTheme();
    initFavorites();
    initSearch();
    initFilters();
    initSort();
    initScrollTop();
    updateAppCount();
});

// ================================
// 星空背景
// ================================
function initStars() {
    const starsContainer = document.getElementById('stars');
    // 既存の星をクリア
    starsContainer.innerHTML = '';
    
    const frag = document.createDocumentFragment();
    
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            width: ${Math.random() * 2 + 1}px;
            height: ${Math.random() * 2 + 1}px;
            --duration: ${Math.random() * 3 + 2}s;
            animation-delay: ${Math.random() * 3}s;
        `;
        frag.appendChild(star);
    }
    
    starsContainer.appendChild(frag);
}

// ================================
// テーマ切替
// ================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // 保存されたテーマを適用
    if (state.theme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        
        state.theme = isLight ? 'light' : 'dark';
        localStorage.setItem('creativeLab_theme', state.theme);
        
        themeIcon.textContent = isLight ? '☀️' : '🌙';
        showToast(isLight ? 'ライトモードに切り替えました' : 'ダークモードに切り替えました');
    });
}

// ================================
// お気に入り機能
// ================================
function initFavorites() {
    const favFilterBtn = document.getElementById('favFilterBtn');
    const favCount = document.getElementById('favCount');
    
    // お気に入りボタンの状態を更新
    updateFavoriteButtons();
    favCount.textContent = state.favorites.length;
    
    // お気に入りフィルターボタン
    favFilterBtn.addEventListener('click', () => {
        state.showFavoritesOnly = !state.showFavoritesOnly;
        favFilterBtn.classList.toggle('active', state.showFavoritesOnly);
        filterCards();
        showToast(state.showFavoritesOnly ? 'お気に入りのみ表示中' : 'すべて表示中');
    });
}

function toggleFavorite(id) {
    const index = state.favorites.indexOf(id);
    
    if (index === -1) {
        state.favorites.push(id);
        showToast('お気に入りに追加しました ⭐');
    } else {
        state.favorites.splice(index, 1);
        showToast('お気に入りから削除しました');
    }
    
    localStorage.setItem('creativeLab_favorites', JSON.stringify(state.favorites));
    updateFavoriteButtons();
    document.getElementById('favCount').textContent = state.favorites.length;
    
    // お気に入りフィルターがONの場合、カードを再フィルター
    if (state.showFavoritesOnly) {
        filterCards();
    }
}

function updateFavoriteButtons() {
    document.querySelectorAll('.card').forEach(card => {
        const id = card.dataset.id;
        const btn = card.querySelector('.fav-btn');
        
        if (state.favorites.includes(id)) {
            btn.textContent = '★';
            btn.classList.add('favorited');
        } else {
            btn.textContent = '☆';
            btn.classList.remove('favorited');
        }
    });
}

// グローバル関数として公開
window.toggleFavorite = toggleFavorite;

// ================================
// 検索機能
// ================================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.searchQuery = e.target.value.toLowerCase();
            filterCards();
        }, 150);
    });
}

// ================================
// フィルター機能
// ================================
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.filter-btn.active').classList.remove('active');
            this.classList.add('active');
            state.currentFilter = this.dataset.filter;
            filterCards();
        });
    });
}

function filterCards() {
    const cards = document.querySelectorAll('.card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const title = card.querySelector('h2').textContent.toLowerCase();
        const desc = card.querySelector('p').textContent.toLowerCase();
        const category = card.dataset.category;
        const id = card.dataset.id;
        
        // 検索マッチ
        const matchSearch = !state.searchQuery || 
            title.includes(state.searchQuery) || 
            desc.includes(state.searchQuery);
        
        // カテゴリフィルター
        const matchFilter = state.currentFilter === 'all' || 
            category === state.currentFilter;
        
        // お気に入りフィルター
        const matchFavorite = !state.showFavoritesOnly || 
            state.favorites.includes(id);
        
        if (matchSearch && matchFilter && matchFavorite) {
            card.classList.remove('hidden');
            card.style.display = '';
            visibleCount++;
        } else {
            card.classList.add('hidden');
            card.style.display = 'none';
        }
    });
    
    // セクションタイトルの表示/非表示
    updateSectionVisibility();
    
    return visibleCount;
}

function updateSectionVisibility() {
    const sections = ['game', 'tool', 'art'];
    
    sections.forEach(section => {
        const grid = document.getElementById(`${section}sGrid`) || 
                     document.querySelector(`[data-section="${section}"]`)?.nextElementSibling;
        
        if (!grid) return;
        
        const visibleCards = grid.querySelectorAll('.card:not(.hidden)').length;
        const sectionTitle = document.querySelector(`[data-section="${section}"]`);
        
        if (sectionTitle) {
            sectionTitle.style.display = visibleCards > 0 ? '' : 'none';
        }
        grid.style.display = visibleCards > 0 ? '' : 'none';
    });
}

// ================================
// ソート機能
// ================================
function initSort() {
    const sortSelect = document.getElementById('sortSelect');
    
    sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        sortCards();
    });
}

function sortCards() {
    const grids = document.querySelectorAll('.grid');
    
    grids.forEach(grid => {
        const cards = Array.from(grid.querySelectorAll('.card'));
        
        cards.sort((a, b) => {
            switch (state.currentSort) {
                case 'name':
                    return a.dataset.name.localeCompare(b.dataset.name, 'ja');
                
                case 'favorites':
                    const aFav = state.favorites.includes(a.dataset.id) ? 0 : 1;
                    const bFav = state.favorites.includes(b.dataset.id) ? 0 : 1;
                    return aFav - bFav;
                
                case 'recent':
                    const aNew = a.dataset.new === 'true' ? 0 : 1;
                    const bNew = b.dataset.new === 'true' ? 0 : 1;
                    return aNew - bNew;
                
                default:
                    return 0;
            }
        });
        
        // DOMを再配置
        cards.forEach(card => grid.appendChild(card));
    });
}

// ================================
// スクロールトップ
// ================================
function initScrollTop() {
    const scrollTopBtn = document.getElementById('scrollTop');
    
    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
    });
}

// ================================
// ナビゲーション
// ================================
function navigateTo(url) {
    window.location.href = url;
}

window.navigateTo = navigateTo;

// ================================
// トースト通知
// ================================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ================================
// アプリ数更新
// ================================
function updateAppCount() {
    const count = document.querySelectorAll('.card').length;
    const appCountEl = document.getElementById('appCount');
    const totalAppsEl = document.getElementById('totalApps');
    
    if (appCountEl) appCountEl.textContent = count + '+';
    if (totalAppsEl) totalAppsEl.textContent = count;
}

// ================================
// キーボードショートカット
// ================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K で検索フォーカス
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Escape で検索クリア
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (document.activeElement === searchInput) {
            searchInput.value = '';
            state.searchQuery = '';
            filterCards();
            searchInput.blur();
        }
    }
});
