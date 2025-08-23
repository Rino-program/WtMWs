// postページ専用JS
// タグ一覧生成＆絞り込み＋もっと見る

document.addEventListener('DOMContentLoaded', function() {
    // タグUI
    const sections = Array.from(document.querySelectorAll('section[data-tags]'));
    const tagSet = new Set();
    sections.forEach(sec => {
        sec.dataset.tags.split(',').forEach(tag => tagSet.add(tag.trim()));
    });

    // 見出しに #番号 + 半角スペース を自動付与/正規化
    sections.forEach((sec, idx) => {
        const h2 = sec.querySelector('h2');
        if(!h2) return;
        const rawId = (sec.id || '').trim();
        let n = parseInt(rawId, 10);
        if(Number.isNaN(n)) n = idx + 1; // 非数IDなら並び順で代替
        const base = h2.textContent || '';
        // 先頭の # / 数字 / スペース を取り除いてタイトル本体を抽出
        const title = base.replace(/^\s*#?\s*\d+\s*/, '').trim();
        h2.textContent = `#${n} ${title}`;
    });
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
            sections.forEach(sec => {
                if(tag === 'ALL' || sec.dataset.tags.split(',').map(t=>t.trim()).includes(tag)) {
                    sec.style.display = '';
                } else {
                    sec.style.display = 'none';
                }
            });
        }
    });
    // resizeはデバウンス
    let roTimer;
    window.addEventListener('resize', function(){
        clearTimeout(roTimer);
        roTimer = setTimeout(checkOverflow, 120);
    });

    // セクション本文「もっと見る」
    document.querySelectorAll('section').forEach(section => {
        const p = section.querySelector('.post-content');
        const btn = section.querySelector('.more-btn');
        if(!p || !btn) return;
        // 3行超えているか判定
        function isOverflowed() {
            return p.scrollHeight > p.clientHeight + 2; // 2px誤差許容
        }
        // 初期判定
        if(isOverflowed()) {
            btn.style.display = '';
        } else {
            btn.style.display = 'none';
        }
        btn.addEventListener('click', function() {
            if(p.classList.contains('expanded')) {
                p.classList.remove('expanded');
                btn.textContent = 'もっと見る';
            } else {
                p.classList.add('expanded');
                btn.textContent = '閉じる';
            }
            // 高さ変化に伴いタグ領域の溢れを再計算
            checkOverflow();
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
});
