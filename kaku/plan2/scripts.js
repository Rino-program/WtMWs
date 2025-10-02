// メインクラス: サイト全体の制御
class DialogueSite {
    constructor() {
        this.isLoaded = false;
        this.scrollPosition = 0;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => this.setup());
        window.addEventListener('load', () => this.loadComplete());
    }

    setup() {
        console.log('サイト初期化開始');
        this.setupLoading();
        this.setupNavigation();
        this.setupDarkMode();
        this.setupAnimations();
        this.setupInteractive();
        this.setupCanvas();
        this.setupProgressBar();
        this.setupQuiz();
        this.setupShare();
        this.setupComments();
        this.setupLazyLoading();
        this.setupAccessibility();
        console.log('初期化完了');
    }

    setupLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const messages = [
            '対話を読み込み中...',
            '核兵器の議論を準備...',
            '未来兵器を分析中...',
            '倫理を考察中...',
            '深い洞察を展開中...'
        ];
        let index = 0;
        const interval = setInterval(() => {
            document.getElementById('loadingText').textContent = messages[index];
            index = (index + 1) % messages.length;
        }, 500);
        setTimeout(() => {
            clearInterval(interval);
            loadingScreen.classList.add('hidden');
            this.isLoaded = true;
            document.body.style.overflow = 'auto';
            this.triggerAnimations();
        }, 2000);  // 最小2秒表示
    }

    setupNavigation() {
        const toggle = document.getElementById('navToggle');
        const menu = document.getElementById('navMenu');
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            menu.classList.toggle('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                target.scrollIntoView({ behavior: 'smooth' });
                menu.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
        window.addEventListener('scroll', this.throttle(this.updateProgress.bind(this), 100));
    }

    setupDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('light');
            toggle.querySelector('i').classList.toggle('fa-sun');
            toggle.querySelector('i').classList.toggle('fa-moon');
        });
        // システム設定に基づく初期化
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.classList.add('light');
        }
    }

    setupAnimations() {
        // 簡易AOS実装 (スクロールでvisibleクラス追加)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
        // カウンターアニメーション
        document.querySelectorAll('.stat-number[data-count]').forEach(el => {
            const count = parseInt(el.dataset.count);
            let current = 0;
            const interval = setInterval(() => {
                current += Math.ceil(count / 50);
                if (current >= count) {
                    current = count;
                    clearInterval(interval);
                }
                el.textContent = current;
            }, 20);
        });
        // Infinityパルス
        document.querySelectorAll('.infinity').forEach(el => {
            el.style.animation = 'infinityPulse 2s infinite';
        });
    }

    setupInteractive() {
        // タイムラインtoggle
        window.toggleTimeline = (header) => {
            header.nextElementSibling.classList.toggle('hidden');
        };
        // ポップアップ (未来マップ用)
        window.showPopup = (title) => {
            alert(`詳細: ${title} - これはポップアップ例です。`);
        };
        // 参加者カードホバーでextra-info表示
        document.querySelectorAll('.participant-card').forEach(card => {
            card.addEventListener('mouseover', () => card.querySelector('.extra-info').classList.remove('hidden'));
            card.addEventListener('mouseout', () => card.querySelector('.extra-info').classList.add('hidden'));
        });
        // 詳細ボタン
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', () => alert('詳細情報: これはモーダルウィンドウの例です。'));
        });
    }

    setupCanvas() {
        const canvas = document.getElementById('heroCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // 粒子アニメーション (興味を引くビジュアル)
        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 1 + 0.5
            });
        }
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#e94560';
                ctx.fill();
                p.y -= p.speed;
                if (p.y < 0) p.y = canvas.height;
            });
            requestAnimationFrame(animate);
        }
        animate();
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    setupProgressBar() {
        this.updateProgress();
    }

    updateProgress() {
        const progress = document.getElementById('progressBar');
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progress.style.width = scrolled + '%';
    }

    setupQuiz() {
        window.quizAnswer = (answer) => {
            const result = document.getElementById('quizResult');
            result.textContent = answer === 'yes' ? '現実的に考えると難しい選択ですね。' : '倫理的に正しいが、技術進化を止めるか？';
            result.classList.remove('hidden');
        };
    }

    setupShare() {
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => alert('シェア機能: これはソーシャルAPIの例です。'));
        });
    }

    setupComments() {
        const form = document.querySelector('.comment-section button');
        form.addEventListener('click', () => {
            const text = document.querySelector('.comment-section textarea').value;
            if (text) alert(`コメント投稿: ${text}`);
        });
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.src = entry.target.dataset.src;
                    observer.unobserve(entry.target);
                }
            });
        });
        images.forEach(img => observer.observe(img));
    }

    setupAccessibility() {
        // キーボードナビ
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('navMenu').classList.remove('active');
            }
        });
        // ARIA更新
        document.querySelectorAll('section[id]').forEach(section => {
            section.setAttribute('role', 'region');
        });
    }

    loadComplete() {
        console.log('ロード完了');
    }

    triggerAnimations() {
        // 初回アニメーション
        document.querySelectorAll('.hero-content > *').forEach((el, i) => {
            setTimeout(() => el.classList.add('reveal'), i * 200);
        });
    }

    throttle(fn, limit) {
        let last;
        return function () {
            const now = Date.now();
            if (now - last < limit) return;
            last = now;
            fn.apply(this, arguments);
        };
    }
}

// インスタンス化
const site = new DialogueSite();

// エラーハンドリング
window.addEventListener('error', (e) => console.error('エラー:', e));

// パフォーマンス監視 (詳細化で長く)
if ('performance' in window) {
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
            console.log(`パフォーマンス: ${entry.name} - ${entry.duration}ms`);
        });
    });
    observer.observe({ entryTypes: ['paint', 'resource'] });
}

// 開発モード
if (location.hostname === 'localhost') {
    console.log('開発モード有効');
}
