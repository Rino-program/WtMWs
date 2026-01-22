// Announcements Renderer
(function(){
    function render(items){
        var container = document.getElementById('announcements-list');
        container.innerHTML = '';
        if(!items || items.length===0){ 
            container.textContent = 'お知らせはありません。'; 
            return; 
        }
        var ul = document.createElement('ul');
        items.forEach(function(it){
            var li = document.createElement('li');

            var dateSpan = document.createElement('span');
            dateSpan.className = 'announcement-date';
            dateSpan.textContent = it.date;

            var textSpan = document.createElement('span');
            textSpan.className = 'announcement-text';
            textSpan.textContent = it.text;

            li.appendChild(dateSpan);
            li.appendChild(textSpan);
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }
    
    fetch('./announcements.json')
        .then(function(r){ return r.json(); })
        .then(function(data){
            var list = data.announcements || [];
            // JSON is expected to be newest-first; take the first 3 entries
            var last3 = list.slice(0, 3);
            render(last3);
        })
        .catch(function(e){
            console.error(e);
            document.getElementById('announcements-list').textContent = 'お知らせの読み込みに失敗しました。';
        });
})();
