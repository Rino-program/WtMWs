// navigate.js
// 入力された数字を4桁に補完して対応するセクションへ移動する
(function(){
    const input = document.getElementById('jump-input');
    const btn = document.getElementById('jump-btn');

    if(!input || !btn) return;

    // 単数あるいはカンマ区切りで複数の番号を正規化して配列で返す
    function normalizeList(val){
        if(!val) return [];
        // 入力中の全ての数字のかたまりを抽出（カンマ区切りや空白に対応）
        const parts = String(val).split(/[,\s]+/).map(s => (s||'').match(/(\d+)/)).filter(Boolean).map(m=>m[1]);
        const nums = parts.map(n => {
            const x = parseInt(n,10);
            return Number.isNaN(x) ? null : String(x).padStart(4,'0');
        }).filter(Boolean);
        return nums;
    }

    function highlightAndFocus(el){
        // 一瞬ハイライト
        el.classList.add('highlight');
        setTimeout(()=> el.classList.remove('highlight'), 1200);
        // アクセシビリティ: フォーカス可能にしてフォーカス
        const prevTabIndex = el.getAttribute('tabindex');
        el.setAttribute('tabindex','-1');
        el.focus({preventScroll:true});
        // 元に戻す（次のフォーカス移動に影響しないよう）
        if(prevTabIndex === null){
            setTimeout(()=> el.removeAttribute('tabindex'), 0);
        } else {
            setTimeout(()=> el.setAttribute('tabindex', prevTabIndex), 0);
        }
    }

    function go(){
        const raw = input.value.trim();
        const ids = normalizeList(raw);
        if(ids.length === 0){
            alert('有効な番号を入力してください (例: 1 または 0001 など、カンマ区切りも可)');
            return;
        }
        // ページ内の section を検索し、data-ids に含まれるか id と一致するものを探す
        const sections = Array.from(document.querySelectorAll('section'));
        let found = null;
        for(const id of ids){
            found = sections.find(sec => {
                const sids = (sec.dataset.ids || sec.id || '').split(/\s*,\s*/).map(x=>x.padStart(4,'0'));
                return sids.includes(id);
            });
            if(found) break;
        }
        if(found){
            found.scrollIntoView({behavior:'smooth', block:'start'});
            highlightAndFocus(found);
            // 更新するハッシュは最初のマッチした番号にする
            const outHash = ids[0].replace(/^0+/, '');
            if(location.hash === '#'+outHash){
                history.replaceState(null,'', '#'+outHash);
            } else {
                history.pushState(null,'', '#'+outHash);
            }
        } else {
            alert('該当するセクションが見つかりません: ' + ids.join(','));
        }
    }

    // ボタン
    btn.addEventListener('click', go);
    // Enterキーで動作
    input.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
            go();
        }
    });

    // 初期値: URLハッシュがある場合、それを正規化して移動
    window.addEventListener('load', function(){
        const h = (location.hash || '').replace('#','');
        if(h){
            const ids = normalizeList(h);
            if(ids.length){
                const sections = Array.from(document.querySelectorAll('section'));
                let found = null;
                for(const id of ids){
                    found = sections.find(sec => {
                        const sids = (sec.dataset.ids || sec.id || '').split(/\s*,\s*/).map(x=>x.padStart(4,'0'));
                        return sids.includes(id);
                    });
                    if(found) break;
                }
                if(found){
                    // 少し待ってからスクロール（ブラウザのデフォルトハッシュ処理上書き対策）
                    setTimeout(()=> {
                        found.scrollIntoView({behavior:'smooth', block:'start'});
                        highlightAndFocus(found);
                    }, 80);
                }
            }
        }
    });
})();
