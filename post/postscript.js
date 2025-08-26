// postページ専用JS
// タグ一覧生成＆絞り込み＋もっと見る

document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // テーマ切替: 明 / 暗 / システム同期
    //  localStorage に 'site-theme' を保存。'light'|'dark'|'system'
    // =========================
    (function(){
        const SWITCH_KEY = 'site-theme';
        const btnsRoot = document.getElementById('theme-switcher');
        const root = document.documentElement;
        const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

        function applyTheme(mode){
            if(mode === 'system'){
                const isDark = mql ? mql.matches : false;
                root.setAttribute('data-theme', isDark ? 'dark' : 'light');
            } else if(mode === 'dark' || mode === 'light'){
                root.setAttribute('data-theme', mode);
            }
            // UI
            if(btnsRoot){
                btnsRoot.querySelectorAll('.theme-btn').forEach(b => {
                    b.setAttribute('aria-pressed', String(b.dataset.theme === mode));
                });
            }
        }

        function initTheme(){
            const stored = localStorage.getItem(SWITCH_KEY) || 'system';
            applyTheme(stored);
        }

        if(btnsRoot){
            btnsRoot.addEventListener('click', function(e){
                const b = e.target.closest && e.target.closest('.theme-btn');
                if(!b) return;
                const mode = b.dataset.theme;
                if(mode === 'system'){
                    localStorage.setItem(SWITCH_KEY, 'system');
                } else if(mode === 'light' || mode === 'dark'){
                    localStorage.setItem(SWITCH_KEY, mode);
                }
                applyTheme(mode);
            });
        }

        // システム設定が変わったら system モード時に反映
        if(mql && mql.addEventListener){
            mql.addEventListener('change', function(){ if(localStorage.getItem(SWITCH_KEY) === 'system'){ applyTheme('system'); } });
        } else if(mql && mql.addListener){
            mql.addListener(function(){ if(localStorage.getItem(SWITCH_KEY) === 'system'){ applyTheme('system'); } });
        }

        initTheme();
    })();

    // =========================
    // リンクの表示をリンク先の<title>に差し替える（可能なときのみ）
    // - CORSで取得できないサイトは静かにスキップ
    // - 同一リンクはlocalStorageでキャッシュ
    // =========================
    (function(){
        const MAX_CONCURRENT = 4;
        const TIMEOUT_MS = 3500;
        const CACHE_KEY = 'post_link_title_cache_v1';
        let cache = {};
        try{ cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }catch(e){ cache = {}; }

        const anchors = Array.from(document.querySelectorAll('.post-content a[href]'));
        // 候補判定: テキストがURLらしい、または表示テキストが長い（生URL）など
        const candidates = anchors.filter(a => {
            const href = a.getAttribute('href') || '';
            if(!href) return false;
            if(href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return false;
            const txt = (a.textContent || '').trim();
            // 既に説明的な短いテキストがある場合は無視
            if(txt && txt.length > 0 && txt.length < 40 && !/^https?:\/\//i.test(txt) && !/^www\./i.test(txt)) return false;
            return true;
        });

        let i = 0; let running = 0;
        function runNext(){
            if(i >= candidates.length) return;
            if(running >= MAX_CONCURRENT) return;
            const a = candidates[i++];
            const hrefAbs = a.href; // ブラウザが解決した絶対URL
            if(!hrefAbs) return runNext();
            if(cache[hrefAbs]){
                a.textContent = cache[hrefAbs];
                a.title = cache[hrefAbs];
                return runNext();
            }
            running++;
            const ac = new AbortController();
            const timer = setTimeout(()=> ac.abort(), TIMEOUT_MS);
            // fetchはCORSに依存するため成功しない場合が多い。失敗しても静かにフォールバック。
            fetch(hrefAbs, {signal: ac.signal, credentials: 'omit'})
            .then(resp => {
                if(!resp.ok) throw new Error('network');
                return resp.text();
            })
            .then(html => {
                const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
                const title = m ? m[1].trim().replace(/\s+/g,' ') : null;
                if(title){
                    try{ cache[hrefAbs] = title; localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }catch(e){}
                    a.textContent = title;
                    a.title = title;
                }
            })
            .catch(()=>{/* ignore */})
            .finally(()=>{ clearTimeout(timer); running--; runNext(); });
            // 直列処理を続けるため再帰
            runNext();
        }
        // キャンディデートを少し遅延させてページ描画優先
        setTimeout(()=>{ runNext(); }, 250);
    })();

    // =========================
    // 1) 動的ナビ生成（#番号一覧）
    // =========================
    const navUl = document.getElementById('nav-inline');
    // タグUI
    const sections = Array.from(document.querySelectorAll('section[data-tags]'));
    const tagSet = new Set();
    sections.forEach(sec => {
        sec.dataset.tags.split(',').forEach(tag => tagSet.add(tag.trim()));
    });

    // 見出しに #番号 + 半角スペース を自動付与/正規化
    // 複数番号（例: data-ids="44,45" または id="44,45"）にも対応し、見出しは "#44,45 タイトル" と表示する
    sections.forEach((sec, idx) => {
        const h2 = sec.querySelector('h2');
        if(!h2) return;
        // data-ids があれば優先、なければ id を参照
        const idsSrc = (sec.dataset.ids || sec.id || '').trim();
        // カンマ区切りで分割し、数字のみ抽出
        const nums = idsSrc.split(/\s*,\s*/).map(s => {
            const n = parseInt((s||'').replace(/^0+/, ''), 10);
            return Number.isNaN(n) ? null : n;
        }).filter(Boolean);
        let displayNums;
        if(nums.length > 0){
            displayNums = nums.join(',');
            // 正規化用に data-ids を確実に設定しておく（HTML 編集なしで動作するように）
            sec.dataset.ids = nums.join(',');
        } else {
            // 数字が取れない場合は順序に基づく番号を代替
            const fallback = idx + 1;
            displayNums = String(fallback);
            sec.dataset.ids = displayNums;
        }
        const base = h2.textContent || '';
        // 先頭の # / 数字 / スペース / カンマ列 を取り除いてタイトル本体を抽出
        const title = base.replace(/^\s*#?\s*[\d\s,]+\s*/, '').trim();
        h2.textContent = `#${displayNums} ${title}`;
    });
    // ナビ: 各セクションの ids と見出しを抽出
    if(navUl){
        // sections から最大の番号を計算
        const allNums = [];
        sections.forEach(sec => {
            const ids = (sec.dataset.ids || sec.id || '').split(/\s*,\s*/).map(s=>s.replace(/^0+/, '')).filter(Boolean).map(n=>parseInt(n,10)).filter(Boolean);
            if(ids.length) ids.forEach(n=> allNums.push(n));
        });
        const maxId = allNums.length ? Math.max(...allNums) : sections.length;
        const step = 20; // 20単位で移動
        const starts = [];
        for(let s = 1; s <= maxId; s += step) starts.push(s);

        navUl.innerHTML = starts.map(s => `<li><button type="button" class="nav-step" data-start="${s}">#${s}${s+step-1 <= maxId ? '–'+(s+step-1) : ''}</button></li>`).join('');

        // クリックでその開始番号以上の最小のIDを持つセクションへ移動
        navUl.addEventListener('click', function(e){
            const btn = e.target.closest && e.target.closest('.nav-step');
            if(!btn) return;
            const start = parseInt(btn.dataset.start, 10);
            if(Number.isNaN(start)) return;
            // すべてのセクションを数値IDにマップして、start 以上のIDを持つ中で最小のIDを選ぶ
            let best = null; // {sec, id}
            sections.forEach(sec => {
                const ids = (sec.dataset.ids || sec.id || '')
                    .split(/\s*,\s*/)
                    .map(s=>s.replace(/^0+/, ''))
                    .filter(Boolean)
                    .map(n=>parseInt(n,10))
                    .filter(Number.isFinite);
                // 対象となる IDs (>= start) を抽出
                const ge = ids.filter(n => n >= start);
                if(ge.length === 0) return;
                const cand = Math.min(...ge);
                if(best === null || cand < best.id){ best = {sec, id: cand}; }
            });
            let target = null;
            let chosenId = null;
            if(best){ target = best.sec; chosenId = best.id; }
            else { target = sections[sections.length-1];
                // 最後のセクションの最小IDを取得（フォールバック）
                const ids = (target.dataset.ids || target.id || '').split(/\s*,\s*/).map(s=>s.replace(/^0+/, '')).filter(Boolean).map(n=>parseInt(n,10)).filter(Number.isFinite);
                chosenId = ids.length ? Math.min(...ids) : null;
            }
            // スクロール & ハイライト
            if(target){
                target.scrollIntoView({behavior:'smooth', block:'start'});
                const prevTab = target.getAttribute('tabindex');
                target.classList.add('highlight');
                setTimeout(()=> target.classList.remove('highlight'), 1200);
                target.setAttribute('tabindex','-1');
                target.focus({preventScroll:true});
                if(prevTab === null){ setTimeout(()=> target.removeAttribute('tabindex'), 0); }
                else { setTimeout(()=> target.setAttribute('tabindex', prevTab), 0); }
            }
            // URL を更新（選ばれたIDで）
            if(chosenId !== null){
                const outHash = String(chosenId).replace(/^0+/, '');
                if(location.hash === '#'+outHash) history.replaceState(null,'', '#'+outHash);
                else history.pushState(null,'', '#'+outHash);
            }
        });
    }

    const tagListFlex = document.getElementById('tag-list-flex');
    const moreBtn = document.getElementById('tag-list-more-btn');
    const tags = Array.from(tagSet);
    tags.push('ALL');
    tagListFlex.innerHTML = tags.map(tag => `<button class="tag-btn" data-tag="${tag}">${tag === 'ALL' ? 'すべて表示' : tag}</button>`).join(' ');

    function checkOverflow() {
        tagListFlex.classList.remove('expanded');
        const maxHeight = parseFloat(getComputedStyle(tagListFlex).maxHeight);
        if(tagListFlex.scrollHeight > maxHeight) {
            moreBtn.style.display = '';
        } else {
            moreBtn.style.display = 'none';
        }
    }
    // 初回 + フォント読み込み後にも再判定
    checkOverflow();
    if(document.fonts && document.fonts.ready){
        document.fonts.ready.then(checkOverflow).catch(()=>{});
    } else {
        setTimeout(checkOverflow, 150);
    }
    let expanded = false;
    moreBtn.addEventListener('click', function() {
        expanded = !expanded;
        if(expanded) {
            tagListFlex.classList.add('expanded');
            moreBtn.textContent = '閉じる';
        } else {
            tagListFlex.classList.remove('expanded');
            moreBtn.textContent = 'もっと見る';
        }
    });
    tagListFlex.addEventListener('click', function(e) {
        if(e.target.classList.contains('tag-btn')) {
            const tag = e.target.dataset.tag;
            tagListFlex.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            applyFilters();
        }
    });
    // resizeはデバウンス
    let roTimer;
    window.addEventListener('resize', function(){
        clearTimeout(roTimer);
        roTimer = setTimeout(checkOverflow, 120);
    });

    // セクション本文「もっと見る」
    // 複数の .post-content を合計で3行表示に制限するロジック
    document.querySelectorAll('section').forEach(section => {
        const ps = Array.from(section.querySelectorAll('.post-content'));
        if(ps.length === 0) return;

        // 測定用ユーティリティ: 要素のフル高さと行高を取得する
        function measure(el){
            const clone = el.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.visibility = 'hidden';
            clone.style.pointerEvents = 'none';
            clone.style.maxHeight = 'none';
            clone.style.height = 'auto';
            clone.style.width = el.clientWidth + 'px';
            document.body.appendChild(clone);
            const fullH = clone.scrollHeight;
            const lh = parseFloat(getComputedStyle(clone).lineHeight) || parseFloat(getComputedStyle(clone).fontSize) * 1.2;
            clone.remove();
            return { fullH, lh };
        }

        // 初回測定
        const metrics = ps.map(p => measure(p));
        // 基本行高は最初の要素の行高を採用（要素ごとの差は小さい想定）
        const baseLine = metrics[0] ? metrics[0].lh : 18;
        const fullLines = metrics.map(m => Math.max(1, Math.round(m.fullH / baseLine)));

        // 合計で表示する行数
        const TOTAL_LINES = 3;

        // 各段落の初期表示行数を計算して適用する関数
        function applyCollapsed(){
            // 段落ごとに "expanded" クラスが付いている場合はその段落は展開状態を維持する。
            // これにより iPad 等でリサイズイベントやフォント読み込みで自動的に折りたたまれる問題を防ぐ。
            let remaining = TOTAL_LINES;
            ps.forEach((p, i) => {
                const full = fullLines[i] || 1;
                const isExpanded = p.classList.contains('expanded');
                if(isExpanded){
                    // 展開状態を維持: 最大高さやoverflowを解除して全表示にする
                    p.style.maxHeight = '';
                    p.style.overflow = '';
                    // 展開されている分だけ残り行数を減らす
                    remaining = Math.max(0, remaining - full);
                } else {
                    const visible = Math.max(0, Math.min(full, remaining));
                    if(visible > 0){
                        p.style.maxHeight = (visible * baseLine) + 'px';
                        p.style.overflow = 'hidden';
                    } else {
                        // 表示行が0なら完全に折りたたむ（高さ0）
                        p.style.maxHeight = '0px';
                        p.style.overflow = 'hidden';
                    }
                    p.classList.remove('expanded');
                    remaining -= visible;
                }
            });
            // 各段落の more-btn 表示判定を更新
            ps.forEach((p, i) => {
                // 固有の識別子を割り当て（sectionごとにユニーク）
                const uid = (section.id || 'sec') + '-para-' + i;
                p.dataset.moreUid = uid;

                // 既存ボタンを検索（section 内で uid に対応するもの）
                let btn = section.querySelector(`.more-btn[data-morefor="${uid}"]`);
                if(!btn){
                    btn = document.createElement('button');
                    btn.className = 'more-btn';
                    btn.type = 'button';
                    btn.textContent = 'もっと見る';
                    btn.style.display = 'none';
                    btn.dataset.morefor = uid;
                    p.after(btn);
                }

                const full = fullLines[i] || 1;
                const currMax = parseFloat(p.style.maxHeight) || 0;
                const currVisibleLines = Math.round(currMax / baseLine);
                if(full > currVisibleLines){
                    btn.style.display = '';
                    // 展開済みなら「閉じる」表示
                    btn.textContent = p.classList.contains('expanded') ? '閉じる' : 'もっと見る';
                } else {
                    btn.style.display = 'none';
                }

                // クリック処理は一度だけ追加
                if(!btn.dataset.handlerAttached){
                    btn.addEventListener('click', function(){
                        if(p.classList.contains('expanded')){
                            // 折りたたみに戻す: まずexpandedを外してから再配分
                            p.classList.remove('expanded');
                            btn.textContent = 'もっと見る';
                            applyCollapsed();
                        } else {
                            // 展開: 当該段落は全表示にする
                            p.classList.add('expanded');
                            p.style.maxHeight = '';
                            p.style.overflow = '';
                            btn.textContent = '閉じる';
                        }
                        checkOverflow();
                    });
                    btn.dataset.handlerAttached = '1';
                }
            });
        }

        // 初期適用
        applyCollapsed();

        // リサイズ時に再測定・再配置（デバウンス）
        let tmr;
        window.addEventListener('resize', function(){
            clearTimeout(tmr);
            tmr = setTimeout(()=>{
                // 再測定
                const newMetrics = ps.map(p => measure(p));
                const newBase = newMetrics[0] ? newMetrics[0].lh : baseLine;
                for(let i=0;i<ps.length;i++){
                    fullLines[i] = Math.max(1, Math.round(newMetrics[i].fullH / newBase));
                }
                // 再適用
                applyCollapsed();
            }, 150);
        });
    });

    // デフォルトで ALL を選択状態にしてフィルタOFF
    const allBtn = tagListFlex.querySelector('[data-tag="ALL"]');
    if(allBtn){
        allBtn.classList.add('selected');
    }

    // 画像のライトボックス処理
    (function(){
        // モーダル要素を作成
    const modal = document.createElement('div');
    modal.className = 'p-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = '<button class="close-btn" type="button" aria-label="閉じる" title="閉じる">✕</button><img alt="" />';
        document.body.appendChild(modal);
        const modalImg = modal.querySelector('img');
        const closeBtn = modal.querySelector('.close-btn');

        function open(src, alt){
            modalImg.src = src;
            modalImg.alt = alt || '';
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            modal.focus && modal.focus();
        }
        function close(){
            modal.classList.remove('open');
            modalImg.src = '';
            document.body.style.overflow = '';
        }

        // 画像クリックを委譲
        document.body.addEventListener('click', function(e){
            const t = e.target;
            if(t && t.matches && t.matches('.post-media img')){
                open(t.src, t.alt);
            }
        });

        // 閉じるボタン・背景クリック（内側クリックは伝播停止）
        const onBtnClose = (e)=>{ e.stopPropagation(); e.preventDefault && e.preventDefault(); close(); };
        closeBtn.addEventListener('click', onBtnClose);
        closeBtn.addEventListener('pointerup', onBtnClose);
        closeBtn.addEventListener('touchend', onBtnClose, {passive:false});
        closeBtn.addEventListener('keydown', (e)=>{
            if(e.key === 'Enter' || e.key === ' '){ onBtnClose(e); }
        });
        modal.addEventListener('click', function(e){
            if(e.target === modal) close();
        });
        modal.addEventListener('pointerup', function(e){ if(e.target === modal) close(); });
        // 画像自体のクリックは閉じないように
        modalImg.addEventListener('click', (e)=> e.stopPropagation());
        // Escで閉じる
        window.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });

        // 念のための委譲（何らかの理由で個別リスナーが外れた場合でも動作）
        document.addEventListener('click', function(e){
            const btn = e.target.closest && e.target.closest('.p-modal .close-btn');
            if(btn){ onBtnClose(e); }
        });
    })();

    // =========================
    // 2) キーワード検索 + タグ複合フィルタ
    // =========================
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');

    function getActiveTag(){
        const sel = tagListFlex.querySelector('.tag-btn.selected');
        return sel ? sel.dataset.tag : 'ALL';
    }

    function matchKeyword(sec, kw){
        if(!kw) return true;
        const text = (sec.textContent || '').toLowerCase();
        return kw.split(/[,\s]+/).filter(Boolean).every(token => text.includes(token.toLowerCase()));
    }

    function applyFilters(){
        const tag = getActiveTag();
        const kw = (searchInput && searchInput.value || '').trim();
        sections.forEach(sec => {
            const tagOk = (tag === 'ALL') || sec.dataset.tags.split(',').map(t=>t.trim()).includes(tag);
            const kwOk = matchKeyword(sec, kw);
            sec.style.display = (tagOk && kwOk) ? '' : 'none';
        });
    }

    if(searchInput){
        searchInput.addEventListener('input', function(){
            applyFilters();
        });
    }
    if(clearBtn){
        clearBtn.addEventListener('click', function(){
            if(searchInput){ searchInput.value = ''; }
            applyFilters();
        });
    }
    // 初期適用（ALL + 空検索）
    applyFilters();

    // =========================
    // 3) 見出しのアンカーコピーと先頭へ + 演出
    // =========================
    // 各セクション見出し右上にコピーアイコンを付与
    sections.forEach(sec => {
        const h2 = sec.querySelector('h2');
        if(!h2) return;
        let btn = sec.querySelector('.anchor-copy');
        if(!btn){
            btn = document.createElement('button');
            btn.className = 'anchor-copy';
            btn.type = 'button';
            btn.title = 'リンクをコピー';
            btn.setAttribute('aria-label','リンクをコピー');
            btn.textContent = '🔗';
            h2.appendChild(btn);
        }
        btn.addEventListener('click', async () => {
            const idRaw = (sec.dataset.ids || sec.id || '').split(/\s*,\s*/)[0] || '';
            const anchor = idRaw.replace(/^0+/, '');
            const url = location.origin + location.pathname + '#' + anchor;
            try{
                await navigator.clipboard.writeText(url);
                btn.textContent = '✅';
                setTimeout(()=> btn.textContent = '🔗', 1200);
            }catch{
                // フォールバック
                const ta = document.createElement('textarea');
                ta.value = url; document.body.appendChild(ta); ta.select();
                try{ document.execCommand('copy'); }catch{}
                ta.remove();
            }
        });
    });

    // 先頭へボタン
    const toTop = document.getElementById('to-top-btn');
    if(toTop){
        toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
        const onScroll = () => {
            if(window.scrollY > 300){ toTop.classList.add('show'); }
            else { toTop.classList.remove('show'); }
        };
        document.addEventListener('scroll', onScroll, {passive:true});
        onScroll();
    }

    // =========================
    // 4) スクロール・リビール + 進捗バー
    // =========================
    (function(){
        const progressBar = document.getElementById('scroll-progress');
        function updateProgress(){
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.scrollY;
            const progress = Math.min(Math.max(scrolled / docHeight, 0), 1);
            if(progressBar){
                progressBar.style.setProperty('--progress', progress);
            }
        }
        document.addEventListener('scroll', updateProgress, {passive: true});
        updateProgress();

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const items = Array.from(document.querySelectorAll('section'));
        items.forEach(el => el.classList.add('reveal-init'));
        if(prefersReduced){
            items.forEach(el => el.classList.add('revealed'));
            return;
        }
        const io = new IntersectionObserver((entries, obs)=>{
            entries.forEach(ent =>{
                if(ent.isIntersecting){
                    ent.target.classList.add('revealed');
                    obs.unobserve(ent.target);
                }
            });
        }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        items.forEach(el => io.observe(el));
    })();

    // =========================
    // 5) 豪華なクラッカー演出（パステル虹色+多様な形）
    // =========================
    (function(){
    // 多重初期化防止
    if(window.__confettiInit){ return; }
    window.__confettiInit = true;
        const PASTEL_COLORS = [
            '#ff9a9e', '#fecfef', '#a8edea', '#fed6e3', '#d299c2', 
            '#fad0c4', '#a8d8ff', '#c2e9fb', '#ffeaa7', '#fab1a0',
            '#fd79a8', '#fdcb6e', '#6c5ce7', '#a29bfe', '#fd79a8'
        ];
        const GOLD_COLORS = [ '#ffd54f', '#ffca28', '#ffc107', '#ffb300', '#ffe082' ];
        const SHAPES = ['normal', 'star', 'circle', 'heart'];
        
        // オプション対応（後方互換: 第3引数がbooleanの場合は special として扱う）
        function spawnLuxuryConfetti(x, y, opts = {}){
            if(typeof opts === 'boolean') opts = { special: opts };
            const special = !!opts.special;
            const count = Number.isFinite(opts.count) ? opts.count : (special ? 28 : 18);
            const colors = Array.isArray(opts.colors) && opts.colors.length ? opts.colors : (special ? GOLD_COLORS : PASTEL_COLORS);
            const shapes = Array.isArray(opts.shapes) && opts.shapes.length ? opts.shapes : SHAPES;
            const durationMs = Number.isFinite(opts.durationMs) ? opts.durationMs : 1300; // confetti-fallはデフォ1200ms
            const baseDistance = Number.isFinite(opts.baseDistance) ? opts.baseDistance : (special ? 120 : 60);
            const varDistance  = Number.isFinite(opts.varDistance)  ? opts.varDistance  : (special ? 220 : 80);
            const angleJitter = Number.isFinite(opts.angleJitter) ? opts.angleJitter : 0.35; // 放射角に揺らぎ
            const spreadMode = opts.spreadMode || (special ? 'disc' : 'ring'); // 'disc' | 'ring'
            const minRadius = Number.isFinite(opts.minRadius) ? opts.minRadius : 0;
            for(let i = 0; i < count; i++){
                const d = document.createElement('div');
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                d.className = `confetti-piece ${shape}`;
        // クリック透過（後続クリックで重ね要素を拾わない）
        d.style.pointerEvents = 'none';
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                d.style.background = color;
                
                // 開始位置
                d.style.setProperty('--x', Math.max(0, x) + 'px');
                d.style.setProperty('--y', Math.max(0, y) + 'px');
                
                // 飛散方向（扇状に広がる）
                let angle, distance;
                if(spreadMode === 'disc'){
                    // 円盤分布: 一様な角度 + rはsqrt分布で均等に面を埋める
                    angle = Math.random() * Math.PI * 2;
                    const maxR = baseDistance + varDistance;
                    const r = minRadius + (maxR - minRadius) * Math.sqrt(Math.random());
                    distance = r;
                } else {
                    // 既存のリング状（等間隔+揺らぎ）
                    angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * angleJitter;
                    distance = baseDistance + Math.random() * varDistance;
                }
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance - Math.random() * 30; // 少し上向きも
                
                d.style.setProperty('--dx', dx + 'px');
                d.style.setProperty('--dy', dy + 'px');
                
                // 回転
                const rotStart = Math.random() * 45 + 'deg';
                const rotEnd = (Math.random() * 720 + 180) + 'deg';
                d.style.setProperty('--rot-mid', rotStart);
                d.style.setProperty('--rot', rotEnd);
                // 長めの残留
                d.style.animationDuration = durationMs + 'ms';
                
                document.body.appendChild(d);
                setTimeout(() => d.remove(), durationMs + 200);
            }
        }
        
        // クリックリップル演出（クリック地点から拡がる波紋）
        function ensureRippleStyles(){
            if(document.getElementById('ripple-styles')) return;
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                .click-ripple{ position: fixed; width: 8px; height: 8px; margin-left: -4px; margin-top: -4px; border-radius: 50%;
                  background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.25) 40%, rgba(255,255,255,0) 60%);
                  pointer-events: none; z-index: 3500; animation: ripple-exp 620ms ease-out forwards; }
                @keyframes ripple-exp{ from{ transform: scale(1); opacity: .75; } to{ transform: scale(20); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }
        function spawnRipple(x, y){
            ensureRippleStyles();
            const r = document.createElement('div');
            r.className = 'click-ripple';
            r.style.left = x + 'px';
            r.style.top = y + 'px';
            document.body.appendChild(r);
            setTimeout(()=> r.remove(), 650);
        }

                // 特大バースト用のショックウェーブとスクリーンシェイク
                                function ensureEpicStyles(){
                                        if(document.getElementById('epic-styles')) return;
                                        const style = document.createElement('style');
                                        style.id = 'epic-styles';
                                        style.textContent = `
                                                .shockwave{ position: fixed; left:0; top:0; width: 20px; height: 20px; border-radius: 50%;
                                                    border: 1px solid rgba(255,255,255,var(--sw-opacity,0.45));
                                                    box-shadow: 0 0 12px rgba(255,255,255,calc(var(--sw-opacity,0.45) * 0.4)), 0 0 24px rgba(255,154,158,calc(var(--sw-opacity,0.45) * 0.25));
                                                    transform: translate(var(--x), var(--y)) translate(-50%, -50%) scale(1);
                                                    pointer-events: none; z-index: 3500; animation: shock-exp var(--sw-duration,600ms) ease-out forwards; }
                                                @keyframes shock-exp{ from{ opacity:var(--sw-opacity,0.6); transform: translate(var(--x), var(--y)) translate(-50%, -50%) scale(1); }
                                                                                            to  { opacity:0;   transform: translate(var(--x), var(--y)) translate(-50%, -50%) scale(calc(var(--sw-scale,16))); } }
                                                .screen-shake{ }
                                        `;
                                        document.head.appendChild(style);
                                }
                function spawnShockwave(x, y, opts){
                    ensureEpicStyles();
                    opts = opts || {};
                    const sw = document.createElement('div');
                    sw.className = 'shockwave';
                    sw.style.setProperty('--x', x + 'px');
                    sw.style.setProperty('--y', y + 'px');
                    // configurable intensity
                    const scale = String(Number.isFinite(opts.scale) ? opts.scale : 16);
                    const opacity = String(Number.isFinite(opts.opacity) ? opts.opacity : 0.75);
                    const duration = String(opts.durationMs ? opts.durationMs + 'ms' : '600ms');
                    sw.style.setProperty('--sw-scale', scale);
                    sw.style.setProperty('--sw-opacity', opacity);
                    sw.style.setProperty('--sw-duration', duration);
                    document.body.appendChild(sw);
                    setTimeout(()=> sw.remove(), (opts.durationMs || 600) + 50);
                }
                function screenShake(intensity){
                    // intensity: suggested pixel amplitude (number)
                    ensureEpicStyles();
                    const root = document.documentElement;
                    const amp = Number.isFinite(intensity) ? intensity : 2; // px
                    // Use Web Animations API for controlled shake
                    try{
                        root.animate([
                            { transform: 'translate(0,0)' },
                            { transform: `translate(${ -amp }px, ${ -amp }px)` },
                            { transform: `translate(${ amp }px, ${ amp }px)` },
                            { transform: `translate(${ -Math.round(amp/2) }px, ${ amp }px)` },
                            { transform: `translate(${ Math.round(amp/2) }px, ${ -Math.round(amp/2) }px)` },
                            { transform: 'translate(0,0)' }
                        ], { duration: Math.min(420, Math.max(260, amp * 80)), easing: 'cubic-bezier(.36,.07,.19,.97)' });
                    }catch(e){
                        // fallback: small class toggle
                        root.classList.remove('screen-shake');
                        void root.offsetWidth;
                        root.classList.add('screen-shake');
                        setTimeout(()=> root.classList.remove('screen-shake'), 340);
                    }
                }
        
        // クリック全域で発火（モーダルやフォーム等は除外）
        // 直前クリックと近接ならスキップ（デバウンス）
        let lastAt = 0, lastX = 0, lastY = 0;
        document.addEventListener('click', (e) => {
            // 除外: モーダル内部・ボタン/入力系・リンク長押しなど
            const t = e.target;
            // 左クリックのみ
            if(e.button !== 0) return;
            if(
                t.closest('.p-modal') ||
                t.closest('button, [role="button"], input, textarea, select, a.anchor-copy')
            ) return;
            const x = e.clientX;
            const y = e.clientY;
            if(Number.isFinite(x) && Number.isFinite(y)){
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                const dt = now - lastAt;
                const dx = Math.abs(x - lastX);
                const dy = Math.abs(y - lastY);
                if(dt < 150 && dx < 6 && dy < 6){
                    return; // 直前とほぼ同じクリックは無視
                }
                lastAt = now; lastX = x; lastY = y;
                spawnRipple(x, y);
                spawnLuxuryConfetti(x, y, false);
            }
        }, {passive: true});
        
        // タグ選択時の小さな演出
        document.body.addEventListener('click', (e) => {
            if(e.target.classList.contains('tag-btn')) {
                const rect = e.target.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                spawnRipple(x, y);
                spawnLuxuryConfetti(x, y, false);
            }
        }, {passive: true});

        // 見出しのアンカーコピー時は金色で華やかに
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest && e.target.closest('.anchor-copy');
            if(!btn) return;
            const rect = btn.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            spawnRipple(x, y);
            spawnLuxuryConfetti(x, y, { special: true, colors: GOLD_COLORS, shapes: ['star','heart'], count: 26 });
        }, {passive: true});

        // 先頭へボタンクリック時のミニ演出
        const toTopBtn = document.getElementById('to-top-btn');
        if(toTopBtn){
            toTopBtn.addEventListener('click', (e) => {
                const rect = toTopBtn.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                spawnRipple(x, y);
                spawnLuxuryConfetti(x, y, { count: 14, shapes: ['circle','star'] });
            }, {passive: true});
        }

        // セクションが初めて表示されたときに控えめな演出
        try{
            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if(!prefersReduced){
                const secs = Array.from(document.querySelectorAll('section'));
                // 10%マージン説明: rootMargin '0px 0px -10% 0px' により、
                // セクションがビューポート下端の10%手前に来たときにコンフェッティを発動。
                // これにより、セクションが完全に見える前に華やかな演出が開始される。
                const io = new IntersectionObserver((entries, obs)=>{
                    entries.forEach(ent =>{
                        if(ent.isIntersecting){
                            const rect = ent.target.getBoundingClientRect();
                            const x = rect.left + rect.width * (0.2 + Math.random()*0.6);
                            const y = rect.top + 24;
                            spawnLuxuryConfetti(x, y, { count: 12, shapes: ['normal','star'] });
                            obs.unobserve(ent.target);
                        }
                    });
                }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
                secs.forEach(s => io.observe(s));
            }
        } catch(_) {}

        // 時々ランダムな場所ではじける自動バースト
        (function(){
            const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if(reduce) return;
            let tId = null;
            function schedule(){
                clearTimeout(tId);
                // 間隔を画面幅に応じて調整（画面が大きいほど短く）
                const vwScale = Math.min(1.6, Math.max(0.6, window.innerWidth / 1280));
                const delay = (3000 + Math.random() * 7000) / vwScale; // 3〜10秒を幅で短縮
                tId = setTimeout(()=>{
                    if(document.visibilityState !== 'visible'){
                        schedule();
                        return;
                    }
                    const marginX = 0.1 * window.innerWidth;
                    const marginY = 0.15 * window.innerHeight;
                    const x = Math.floor(marginX + Math.random() * (window.innerWidth - marginX*2));
                    const y = Math.floor(marginY + Math.random() * (window.innerHeight - marginY*2));
                    // 50%で特大バースト（ショックウェーブ + シェイク + 大量コンフェッティ）
                    // Weighted burst selection influenced by viewport width
                    const vw = Math.min(1.6, Math.max(0.6, window.innerWidth / 1280));
                    // base weights (sum=100)
                    const weights = {
                        epic: 7,
                        midrnd: 10,
                        midA: 15,
                        midB: 15,
                        midC: 15,
                        small: 38
                    };
                    // larger viewports increase weight for big bursts
                    const bigMultiplier = vw; // 0.6..1.6
                    const weighted = {
                        epic: weights.epic * bigMultiplier,
                        midrnd: weights.midrnd * bigMultiplier,
                        midA: weights.midA * bigMultiplier,
                        midB: weights.midB * bigMultiplier,
                        midC: weights.midC * bigMultiplier,
                        small: weights.small
                    };
                    const total = Object.values(weighted).reduce((a,b)=>a+b,0);
                    // pick by weight
                    let pick = Math.random() * total;
                    let badgeText = '';
                    if(pick < weighted.epic){
                        badgeText = 'EPIC';
                        spawnShockwave(x, y, { scale: 18, opacity: 0.75, durationMs: 700 });
                        screenShake(4);
                        const EPIC_COLORS = PASTEL_COLORS.concat(GOLD_COLORS);
                        const count = 220 + Math.floor(Math.random() * 81); // 220〜300
                        spawnLuxuryConfetti(x, y, {
                            special: true,
                            count,
                            colors: EPIC_COLORS,
                            shapes: ['normal','star','circle','heart'],
                            durationMs: 3000,
                            baseDistance: 160,
                            varDistance: 300,
                            angleJitter: 0.8,
                            spreadMode: 'disc',
                            minRadius: 0
                        });
                    } else {
                        pick -= weighted.epic;
                        if(pick < weighted.midrnd){
                            badgeText = 'MID-RND';
                            const palette = (Math.random() < 0.5) ? PASTEL_COLORS : GOLD_COLORS;
                            spawnLuxuryConfetti(x, y, { count: 44 + Math.floor(Math.random()*12), colors: palette, durationMs: 2200, baseDistance: 100, varDistance: 140, spreadMode: 'disc' });
                        } else {
                            pick -= weighted.midrnd;
                            if(pick < weighted.midA){
                                badgeText = 'MID-A';
                                spawnLuxuryConfetti(x, y, { count: 36, colors: ['#a8edea','#c2e9fb','#a29bfe'], shapes: ['circle','normal'], durationMs: 2300, baseDistance: 90, varDistance: 120 });
                            } else {
                                pick -= weighted.midA;
                                if(pick < weighted.midB){
                                    badgeText = 'MID-B';
                                    spawnLuxuryConfetti(x, y, { count: 36, colors: ['#ff9a9e','#fed6e3','#fd79a8'], shapes: ['star','normal'], durationMs: 2300, baseDistance: 90, varDistance: 120 });
                                } else {
                                    pick -= weighted.midB;
                                    if(pick < weighted.midC){
                                        badgeText = 'MID-C';
                                        spawnLuxuryConfetti(x, y, { count: 36, colors: ['#ffeaa7','#fad0c4','#a8d8ff'], shapes: ['heart','circle'], durationMs: 2300, baseDistance: 90, varDistance: 120 });
                                    } else {
                                        badgeText = 'SMALL';
                                        spawnLuxuryConfetti(x, y, { count: 12, shapes: ['normal','star'], durationMs: 1600, baseDistance: 60, varDistance: 80 });
                                    }
                                }
                            }
                        }
                    }

                    // Subtle indicator of which burst happened (small badge bottom-right)
                    try{
                        const id = '__burstBadge';
                        let b = document.getElementById(id);
                        if(!b){ b = document.createElement('div'); b.id = id; b.style.position = 'fixed'; b.style.left = '12px'; b.style.bottom = '12px'; b.style.padding = '8px 10px'; b.style.borderRadius = '12px'; b.style.fontSize = '12px'; b.style.background = 'rgba(0,0,0,0.34)'; b.style.color = 'rgba(255,255,255,0.95)'; b.style.zIndex = 6000; b.style.backdropFilter = 'blur(6px)'; b.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)'; document.body.appendChild(b); }
                        b.textContent = badgeText;
                        b.style.opacity = '0.02';
                        // fade in/out subtly
                        b.style.transition = 'opacity 260ms linear';
                        requestAnimationFrame(()=> b.style.opacity = '0.9');
                        clearTimeout(b._t);
                        b._t = setTimeout(()=>{ b.style.opacity = '0.02'; }, 1600);
                    }catch(e){}
                    schedule();
                }, delay);
            }
            document.addEventListener('visibilitychange', ()=>{
                if(document.visibilityState === 'visible') schedule();
            });
            schedule();
        })();
    })();

    // =========================
    // 6) キーボードショートカット + 豪華トースト
    //    - / or f: 検索へフォーカス
    //    - t: 先頭へ
    //    - ?: ヘルプのトースト
    // =========================
    (function(){
        let toastTimer = null;
        function showToast(msg){
            let el = document.getElementById('mini-toast');
            if(!el){
                el = document.createElement('div');
                el.id = 'mini-toast';
                el.style.position = 'fixed';
                el.style.left = '50%';
                el.style.bottom = '24px';
                el.style.transform = 'translateX(-50%)';
                el.style.background = 'linear-gradient(45deg, rgba(255,154,158,0.95), rgba(168,237,234,0.95))';
                el.style.color = 'var(--text)';
                el.style.border = '1px solid rgba(255,255,255,0.2)';
                el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1), 0 0 20px rgba(255,154,158,0.3)';
                el.style.borderRadius = '15px';
                el.style.padding = '.7rem 1rem';
                el.style.zIndex = '4000';
                el.style.fontSize = '.95rem';
                el.style.backdropFilter = 'blur(10px)';
                el.style.fontWeight = '500';
                document.body.appendChild(el);
            }
            el.textContent = msg;
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) translateY(20px) scale(0.9)';
            el.style.transition = 'all .25s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            requestAnimationFrame(()=>{
                el.style.opacity = '1';
                el.style.transform = 'translateX(-50%) translateY(0) scale(1)';
            });
            clearTimeout(toastTimer);
            toastTimer = setTimeout(()=>{
                el.style.opacity = '0';
                el.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
            }, 2200);
        }
        document.addEventListener('keydown', (e)=>{
            if(e.defaultPrevented) return;
            const tag = (e.target && e.target.tagName || '').toLowerCase();
            const typing = ['input','textarea'].includes(tag);
            if(!typing && (e.key === '/' || e.key.toLowerCase() === 'f')){
                const si = document.getElementById('search-input');
                if(si){ si.focus(); si.select && si.select(); e.preventDefault(); }
                showToast('🔍 検索モードに切り替えました');
            } else if(!typing && e.key.toLowerCase() === 't'){
                window.scrollTo({top:0, behavior:'smooth'});
                showToast('⬆️ ページトップへ移動します');
            } else if(!typing && e.key === '?'){
                showToast('✨ ショートカット: / または F →検索, T →先頭へ, ? →ヘルプ');
            }
        });
    })();

    // =========================
    // iPad/タッチデバイス用ヘルプボタン
    // =========================
    (function(){
        const helpBtn = document.getElementById('help-btn');
        if(helpBtn){
            // showToast関数を使用するため、この位置で定義
            helpBtn.addEventListener('click', () => {
                // 上記のshowToast関数を参照（同じスコープ内）
                const showToastLocal = document.querySelector('#mini-toast') ? 
                    (msg) => {
                        let el = document.getElementById('mini-toast');
                        if(!el){
                            el = document.createElement('div');
                            el.id = 'mini-toast';
                            el.style.position = 'fixed';
                            el.style.left = '50%';
                            el.style.bottom = '24px';
                            el.style.transform = 'translateX(-50%)';
                            el.style.background = 'linear-gradient(45deg, rgba(255,154,158,0.95), rgba(168,237,234,0.95))';
                            el.style.color = 'var(--text)';
                            el.style.border = '1px solid rgba(255,255,255,0.2)';
                            el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1), 0 0 20px rgba(255,154,158,0.3)';
                            el.style.borderRadius = '15px';
                            el.style.padding = '.7rem 1rem';
                            el.style.zIndex = '4000';
                            el.style.maxWidth = '90%';
                            el.style.wordBreak = 'break-word';
                            el.style.whiteSpace = 'pre-line';
                            el.style.fontWeight = '500';
                            el.style.backdropFilter = 'blur(10px)';
                            document.body.appendChild(el);
                        }
                        el.textContent = msg;
                        el.style.opacity = '0';
                        el.style.transform = 'translateX(-50%) translateY(20px) scale(0.9)';
                        el.style.transition = 'all .25s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        requestAnimationFrame(()=>{
                            el.style.opacity = '1';
                            el.style.transform = 'translateX(-50%) translateY(0) scale(1)';
                        });
                        setTimeout(()=>{
                            el.style.opacity = '0';
                            el.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
                        }, 2200);
                    } : () => {}; // フォールバック
                
                showToastLocal('📱 操作方法\n' +
                             '🔍 検索: 上部の検索ボックス\n' +
                             '🏷️ タグ: カテゴリーで絞り込み\n' +
                             '⬆️ 先頭へ: 右下のボタン\n' +
                             '💻 PC: / →検索, T →先頭へ, ? →ヘルプ');
            });
        }
    })();

    // =========================
    // 7) ランダムキラキラ背景演出
    // =========================
    (function(){
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(prefersReduced) return;
        
        function createSparkle(){
            const sparkle = document.createElement('div');
            sparkle.style.position = 'fixed';
            sparkle.style.width = '4px';
            sparkle.style.height = '4px';
            sparkle.style.background = '#fff';
            sparkle.style.borderRadius = '50%';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '1';
            sparkle.style.opacity = '0';
            
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            sparkle.style.left = x + 'px';
            sparkle.style.top = y + 'px';
            
            sparkle.style.animation = 'sparkle-twinkle 2s ease-in-out forwards';
            
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 2100);
        }
        // ランダムキラキラ（1.8秒ごとに4〜5個）: 同時発生しすぎないように微分散
        setInterval(() => {
            const burst = 4 + Math.floor(Math.random() * 2); // 4 or 5
            for(let i=0;i<burst;i++) setTimeout(createSparkle, Math.random() * 450); // 0〜450msでランダム発火
        }, 1800);
        
        // キラキラのCSSアニメーション（動的追加）
        if(!document.getElementById('sparkle-styles')){
            const style = document.createElement('style');
            style.id = 'sparkle-styles';
            style.textContent = `
                @keyframes sparkle-twinkle {
                    0%, 100% { opacity: 0; transform: scale(0.8); }
                    50% { opacity: 0.8; transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
        }
    })();
 });