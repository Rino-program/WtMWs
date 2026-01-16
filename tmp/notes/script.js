let notes=JSON.parse(localStorage.getItem('notes')||'[]');
let currentNoteId=null;

function generateId(){
    return Date.now().toString(36)+Math.random().toString(36).substr(2);
}

function saveNotes(){
    localStorage.setItem('notes',JSON.stringify(notes));
    updateStats();
}

function createNote(){
    const note={
        id:generateId(),
        title:'',
        content:'',
        tags:[],
        createdAt:Date.now(),
        updatedAt:Date.now()
    };
    notes.unshift(note);
    saveNotes();
    selectNote(note.id);
    renderNotesList();
}

function selectNote(id){
    currentNoteId=id;
    const note=notes.find(n=>n.id===id);
    if(!note)return;
    
    document.getElementById('emptyState').style.display='none';
    document.getElementById('editorContent').style.display='flex';
    document.getElementById('noteTitle').value=note.title;
    document.getElementById('noteContent').value=note.content;
    renderTags();
    renderNotesList();
}

function updateNote(){
    if(!currentNoteId)return;
    const note=notes.find(n=>n.id===currentNoteId);
    if(!note)return;
    
    note.title=document.getElementById('noteTitle').value;
    note.content=document.getElementById('noteContent').value;
    note.updatedAt=Date.now();
    saveNotes();
    renderNotesList();
}

function deleteNote(id,e){
    if(e)e.stopPropagation();
    if(!confirm('このメモを削除しますか？'))return;
    notes=notes.filter(n=>n.id!==id);
    saveNotes();
    if(currentNoteId===id){
        currentNoteId=null;
        document.getElementById('emptyState').style.display='flex';
        document.getElementById('editorContent').style.display='none';
    }
    renderNotesList();
}

function deleteCurrentNote(){
    if(currentNoteId)deleteNote(currentNoteId);
}

function formatText(type){
    const textarea=document.getElementById('noteContent');
    const start=textarea.selectionStart;
    const end=textarea.selectionEnd;
    const text=textarea.value;
    const selected=text.substring(start,end);
    let replacement='';
    
    switch(type){
        case'bold':replacement=`**${selected||'太字'}**`;break;
        case'italic':replacement=`*${selected||'斜体'}*`;break;
        case'heading':replacement=`\n## ${selected||'見出し'}\n`;break;
        case'list':replacement=`\n- ${selected||'項目'}\n`;break;
        case'checklist':replacement=`\n- [ ] ${selected||'タスク'}\n`;break;
        case'code':replacement=`\`${selected||'code'}\``;break;
        case'link':replacement=`[${selected||'リンク'}](url)`;break;
    }
    
    textarea.value=text.substring(0,start)+replacement+text.substring(end);
    textarea.focus();
    updateNote();
}

function addTag(){
    const tag=prompt('タグを入力:');
    if(!tag)return;
    const note=notes.find(n=>n.id===currentNoteId);
    if(!note)return;
    if(!note.tags.includes(tag)){
        note.tags.push(tag);
        saveNotes();
        renderTags();
    }
}

function removeTag(tag){
    const note=notes.find(n=>n.id===currentNoteId);
    if(!note)return;
    note.tags=note.tags.filter(t=>t!==tag);
    saveNotes();
    renderTags();
}

function renderTags(){
    const note=notes.find(n=>n.id===currentNoteId);
    if(!note)return;
    
    document.getElementById('tagsContainer').innerHTML=
        note.tags.map(t=>`<span class="tag">${t}<button onclick="removeTag('${t}')">×</button></span>`).join('')+
        '<span class="add-tag" onclick="addTag()">+ タグ追加</span>';
}

function renderNotesList(){
    const searchTerm=document.getElementById('searchInput').value.toLowerCase();
    const filtered=notes.filter(n=>
        n.title.toLowerCase().includes(searchTerm)||
        n.content.toLowerCase().includes(searchTerm)
    );
    
    document.getElementById('notesList').innerHTML=filtered.map(note=>{
        const preview=note.content.substring(0,50)||(note.title?'':'空のメモ');
        const date=new Date(note.updatedAt);
        const dateStr=`${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`;
        return`
            <div class="note-item${note.id===currentNoteId?' active':''}" onclick="selectNote('${note.id}')">
                <h3>${note.title||'無題のメモ'}</h3>
                <p>${preview}...</p>
                <div class="note-meta">
                    <span>${dateStr}</span>
                    <button class="delete-btn" onclick="deleteNote('${note.id}',event)">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterNotes(){
    renderNotesList();
}

function updateStats(){
    const total=notes.length;
    const chars=notes.reduce((sum,n)=>sum+n.content.length,0);
    document.getElementById('statsText').textContent=`${total}件のメモ • ${chars}文字`;
}

function exportNote(){
    const note=notes.find(n=>n.id===currentNoteId);
    if(!note)return;
    
    const content=`# ${note.title}\n\n${note.content}\n\n---\n作成: ${new Date(note.createdAt).toLocaleString()}\n更新: ${new Date(note.updatedAt).toLocaleString()}`;
    const blob=new Blob([content],{type:'text/markdown'});
    const a=document.createElement('a');
    a.download=(note.title||'note')+'.md';
    a.href=URL.createObjectURL(blob);
    a.click();
}

// 初期化
renderNotesList();
updateStats();

// キーボードショートカット
document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey){
        if(e.key==='n'){e.preventDefault();createNote()}
        if(e.key==='s'){e.preventDefault();/* 自動保存済み */}
    }
});
