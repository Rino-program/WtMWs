// postページ専用JS
// タグ一覧生成＆絞り込み＋もっと見る

document.addEventListener('DOMContentLoaded', function() {
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
            let remaining = TOTAL_LINES;
            ps.forEach((p, i) => {
                const full = fullLines[i] || 1;
                const visible = Math.max(0, Math.min(full, remaining));
                if(visible > 0){
                    p.style.maxHeight = (visible * baseLine) + 'px';
                    p.style.overflow = 'hidden';
                    p.classList.remove('expanded');
                } else {
                    // 表示行が0なら完全に折りたたむ（高さ0）
                    p.style.maxHeight = '0px';
                    p.style.overflow = 'hidden';
                    p.classList.remove('expanded');
                }
                remaining -= visible;
            });
            // 各段落の more-btn 表示判定を更新
            ps.forEach((p, i) => {
                let btn = p.nextElementSibling;
                if(!btn || !btn.classList.contains('more-btn')){
                    btn = document.createElement('button');
                    btn.className = 'more-btn';
                    btn.type = 'button';
                    btn.textContent = 'もっと見る';
                    btn.style.display = 'none';
                    p.after(btn);
                }
                const full = fullLines[i] || 1;
                const currMax = parseFloat(p.style.maxHeight) || 0;
                const currVisibleLines = Math.round(currMax / baseLine);
                if(full > currVisibleLines){
                    btn.style.display = '';
                    btn.textContent = 'もっと見る';
                } else {
                    btn.style.display = 'none';
                }

                // クリック処理（各段落ごと）
                btn.onclick = function(){
                    if(p.classList.contains('expanded')){
                        // 折りたたみに戻す
                        applyCollapsed();
                    } else {
                        // 展開: 当該段落は全表示にする
                        p.classList.add('expanded');
                        p.style.maxHeight = '';
                        p.style.overflow = '';
                        btn.textContent = '閉じる';
                    }
                    checkOverflow();
                };
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
        modal.innerHTML = '<button class="close-btn" aria-label="閉じる">✕</button><img alt="" />';
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

        // 閉じるボタン・背景クリック
        closeBtn.addEventListener('click', close);
        modal.addEventListener('click', function(e){
            if(e.target === modal) close();
        });
        // Escで閉じる
        window.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
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
    // 3) 見出しのアンカーコピーと先頭へ
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
});
