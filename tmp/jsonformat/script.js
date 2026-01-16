const input=document.getElementById('input');
const output=document.getElementById('output');
const error=document.getElementById('error');

input.addEventListener('input',()=>{
    error.classList.remove('show');
    if(input.value.trim())formatJSON();
});

function getIndent(){
    const val=document.getElementById('indent').value;
    if(val==='tab')return'\t';
    return parseInt(val);
}

function formatJSON(){
    try{
        const json=JSON.parse(input.value);
        const indent=getIndent();
        const formatted=JSON.stringify(json,null,indent);
        displayOutput(json,formatted);
        updateStats(json,formatted);
        error.classList.remove('show');
    }catch(e){
        error.textContent='❌ JSONパースエラー: '+e.message;
        error.classList.add('show');
        output.textContent='';
    }
}

function minifyJSON(){
    try{
        const json=JSON.parse(input.value);
        const minified=JSON.stringify(json);
        output.textContent=minified;
        updateStats(json,minified);
        error.classList.remove('show');
    }catch(e){
        error.textContent='❌ JSONパースエラー: '+e.message;
        error.classList.add('show');
    }
}

function displayOutput(json,formatted){
    const mode=document.getElementById('viewMode').value;
    if(mode==='formatted'){
        output.textContent=formatted;
    }else if(mode==='highlighted'){
        output.innerHTML=syntaxHighlight(formatted);
    }else if(mode==='tree'){
        output.innerHTML=buildTree(json);
    }
}

function syntaxHighlight(json){
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,match=>{
        let cls='json-number';
        if(/^"/.test(match)){
            if(/:$/.test(match))cls='json-key';
            else cls='json-string';
        }else if(/true|false/.test(match)){
            cls='json-boolean';
        }else if(/null/.test(match)){
            cls='json-null';
        }
        return'<span class="'+cls+'">'+match+'</span>';
    }).replace(/[{}\[\]]/g,'<span class="json-bracket">$&</span>');
}

function buildTree(obj,key='root'){
    if(obj===null)return'<span class="json-null">null</span>';
    if(typeof obj!=='object')return escapeHtml(JSON.stringify(obj));
    
    const isArray=Array.isArray(obj);
    const entries=Object.entries(obj);
    if(!entries.length)return isArray?'[]':'{}';
    
    let html=`<span class="tree-toggle" onclick="this.parentElement.classList.toggle('collapsed')">▼</span>`;
    html+=isArray?'[':'{';
    html+='<div class="tree-children">';
    entries.forEach(([k,v],i)=>{
        html+=`<div class="tree-item">`;
        if(!isArray)html+=`<span class="json-key">"${escapeHtml(k)}"</span>: `;
        html+=buildTree(v,k);
        if(i<entries.length-1)html+=',';
        html+='</div>';
    });
    html+='</div>';
    html+=isArray?']':'}';
    return html;
}

function escapeHtml(str){
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function updateStats(json,str){
    const stats=document.getElementById('stats');
    const size=new Blob([str]).size;
    const depth=getDepth(json);
    const keys=countKeys(json);
    stats.innerHTML=`
        <div class="stat">サイズ: <span class="stat-val">${formatBytes(size)}</span></div>
        <div class="stat">深さ: <span class="stat-val">${depth}</span></div>
        <div class="stat">キー数: <span class="stat-val">${keys}</span></div>
        <div class="stat">文字数: <span class="stat-val">${str.length.toLocaleString()}</span></div>
    `;
}

function getDepth(obj,current=0){
    if(typeof obj!=='object'||obj===null)return current;
    return Math.max(...Object.values(obj).map(v=>getDepth(v,current+1)),current+1);
}

function countKeys(obj){
    if(typeof obj!=='object'||obj===null)return 0;
    return Object.keys(obj).length+Object.values(obj).reduce((a,v)=>a+countKeys(v),0);
}

function formatBytes(bytes){
    if(bytes<1024)return bytes+' B';
    if(bytes<1024*1024)return(bytes/1024).toFixed(1)+' KB';
    return(bytes/1024/1024).toFixed(1)+' MB';
}

function copyOutput(){
    const text=output.textContent;
    navigator.clipboard.writeText(text).then(()=>alert('コピーしました！'));
}

async function pasteFromClipboard(){
    try{
        const text=await navigator.clipboard.readText();
        input.value=text;
        formatJSON();
    }catch(e){
        alert('クリップボードから読み取れませんでした');
    }
}

function clearAll(){
    input.value='';
    output.textContent='';
    document.getElementById('stats').innerHTML='';
    error.classList.remove('show');
}

function downloadJSON(){
    const text=output.textContent;
    if(!text)return;
    const blob=new Blob([text],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='formatted.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadSample(){
    input.value=JSON.stringify({
        "name":"Creative Lab",
        "version":"1.0.0",
        "description":"インタラクティブなWebアプリ集",
        "apps":[
            {"name":"テトリス","category":"game","featured":true},
            {"name":"電卓","category":"tool","featured":false},
            {"name":"パーティクル","category":"art","featured":true}
        ],
        "settings":{
            "theme":"dark",
            "language":"ja",
            "notifications":{"email":true,"push":false}
        },
        "stats":{"users":1000,"views":50000,"rating":4.8}
    },null,2);
    formatJSON();
}

document.getElementById('viewMode').addEventListener('change',()=>{
    if(input.value.trim())formatJSON();
});
document.getElementById('indent').addEventListener('change',()=>{
    if(input.value.trim())formatJSON();
});
