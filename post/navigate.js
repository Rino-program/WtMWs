// navigate.js
// 入力された数字を4桁に補完して対応するセクションへ移動する
(function(){
    const input = document.getElementById('jump-input');
    const btn = document.getElementById('jump-btn');

    if(!input || !btn) return;

    function normalize(val){
        if(!val) return null;
        // 数字のみ抽出
        const m = val.match(/(\d+)/);
        if(!m) return null;
        let num = m[1];
        // 先頭の0を無視してから再補完することで、'0001'や'1'両方を扱う
        num = String(parseInt(num,10));
        if(isNaN(num)) return null;
        // 4桁に0埋め
        return num.padStart(4,'0');
    }

    function go(){
        const raw = input.value.trim();
        const id = normalize(raw);
        if(!id){
            alert('有効な番号を入力してください (例: 1 または 0001 など)');
            return;
        }
        const el = document.getElementById(id);
        if(el){
            el.scrollIntoView({behavior:'smooth', block:'start'});
            // ハッシュ更新（履歴に残る）
            history.pushState(null,'', '#'+id);
        } else {
            alert('該当するセクションが見つかりません: ' + id);
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
            const nid = normalize(h);
            if(nid){
                const el = document.getElementById(nid);
                if(el){
                    // 少し待ってからスクロール（ブラウザのデフォルトハッシュ処理上書き対策）
                    setTimeout(()=> el.scrollIntoView({behavior:'smooth', block:'start'}), 50);
                }
            }
        }
    });
})();
