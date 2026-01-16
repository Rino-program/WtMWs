let colors=[],lockedIndices=[];
let saved=JSON.parse(localStorage.getItem('savedPalettes')||'[]');
let exportFormat='css';

document.querySelectorAll('.export-tab').forEach(tab=>{
    tab.onclick=function(){
        document.querySelector('.export-tab.active').classList.remove('active');
        this.classList.add('active');
        exportFormat=this.dataset.format;
        updateExport();
    };
});

function hslToHex(h,s,l){
    s/=100;l/=100;
    const a=s*Math.min(l,1-l);
    const f=n=>{
        const k=(n+h/30)%12;
        const color=l-a*Math.max(Math.min(k-3,9-k,1),-1);
        return Math.round(255*color).toString(16).padStart(2,'0');
    };
    return`#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex){
    let r=parseInt(hex.slice(1,3),16)/255;
    let g=parseInt(hex.slice(3,5),16)/255;
    let b=parseInt(hex.slice(5,7),16)/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){h=s=0;}
    else{
        const d=max-min;
        s=l>0.5?d/(2-max-min):d/(max+min);
        switch(max){
            case r:h=((g-b)/d+(g<b?6:0))*60;break;
            case g:h=((b-r)/d+2)*60;break;
            case b:h=((r-g)/d+4)*60;break;
        }
    }
    return{h,s:s*100,l:l*100};
}

function generatePalette(){
    const count=parseInt(document.getElementById('colorCount').value);
    const harmony=document.getElementById('harmony').value;
    const baseHex=document.getElementById('baseColor').value;
    const base=hexToHsl(baseHex);
    
    const newColors=[];
    for(let i=0;i<count;i++){
        if(lockedIndices.includes(i)&&colors[i]){
            newColors.push(colors[i]);
            continue;
        }
        let h,s,l;
        switch(harmony){
            case'analogous':
                h=(base.h+i*30-((count-1)*15))%360;
                s=base.s+Math.random()*20-10;
                l=base.l+Math.random()*20-10;
                break;
            case'complementary':
                h=i%2===0?base.h:(base.h+180)%360;
                h+=Math.random()*20-10;
                s=base.s+Math.random()*20-10;
                l=40+Math.random()*40;
                break;
            case'triadic':
                h=(base.h+i*120)%360;
                s=base.s+Math.random()*20-10;
                l=base.l+Math.random()*30-15;
                break;
            case'tetradic':
                h=(base.h+i*90)%360;
                s=base.s+Math.random()*20-10;
                l=base.l+Math.random()*30-15;
                break;
            case'split':
                const angles=[0,150,210];
                h=(base.h+angles[i%3])%360;
                s=base.s+Math.random()*20-10;
                l=base.l+Math.random()*30-15;
                break;
            case'monochromatic':
                h=base.h;
                s=base.s;
                l=20+i*(60/count)+Math.random()*10;
                break;
            default:
                h=Math.random()*360;
                s=50+Math.random()*40;
                l=40+Math.random()*40;
        }
        h=(h+360)%360;
        s=Math.max(0,Math.min(100,s));
        l=Math.max(15,Math.min(85,l));
        newColors.push(hslToHex(h,s,l));
    }
    colors=newColors;
    render();
}

function render(){
    const palette=document.getElementById('palette');
    palette.innerHTML=colors.map((c,i)=>`
        <div class="color-swatch${lockedIndices.includes(i)?' locked':''}" style="background:${c}" onclick="copyColor('${c}')">
            <button class="lock-btn" onclick="event.stopPropagation();toggleLock(${i})">${lockedIndices.includes(i)?'🔒':'🔓'}</button>
            <div class="color-info">
                <div class="color-hex">${c.toUpperCase()}</div>
                <div class="color-name">${getColorName(c)}</div>
            </div>
        </div>
    `).join('');
    updateExport();
}

function getColorName(hex){
    const{h,s,l}=hexToHsl(hex);
    if(s<10)return l>70?'白系':'グレー系';
    if(l<20)return'黒系';
    const hues=[
        [0,'赤'],[30,'オレンジ'],[60,'黄'],[120,'緑'],
        [180,'シアン'],[240,'青'],[280,'紫'],[320,'マゼンタ']
    ];
    for(let i=0;i<hues.length;i++){
        if(h<hues[i][0]+30)return hues[i][1]+'系';
    }
    return'赤系';
}

function toggleLock(i){
    const idx=lockedIndices.indexOf(i);
    if(idx>-1)lockedIndices.splice(idx,1);
    else lockedIndices.push(i);
    render();
}

function copyColor(hex){
    navigator.clipboard.writeText(hex.toUpperCase());
    document.getElementById('harmonyInfo').textContent=`${hex.toUpperCase()} をコピーしました`;
    setTimeout(()=>{
        document.getElementById('harmonyInfo').textContent='スペースキーで新しいパレットを生成';
    },2000);
}

function copyAll(){
    navigator.clipboard.writeText(colors.map(c=>c.toUpperCase()).join(', '));
    alert('すべての色をコピーしました！');
}

function updateExport(){
    let code='';
    switch(exportFormat){
        case'css':
            code=`:root {\n${colors.map((c,i)=>`  --color-${i+1}: ${c};`).join('\n')}\n}`;
            break;
        case'scss':
            code=colors.map((c,i)=>`$color-${i+1}: ${c};`).join('\n');
            break;
        case'json':
            code=JSON.stringify({colors:colors.map(c=>c.toUpperCase())},null,2);
            break;
        case'array':
            code=`const colors = ${JSON.stringify(colors.map(c=>c.toUpperCase()))};`;
            break;
    }
    document.getElementById('exportCode').textContent=code;
}

function savePalette(){
    saved.unshift({colors:[...colors],date:Date.now()});
    saved=saved.slice(0,20);
    localStorage.setItem('savedPalettes',JSON.stringify(saved));
    renderSaved();
}

function renderSaved(){
    document.getElementById('savedList').innerHTML=saved.map((p,i)=>`
        <div class="saved-item">
            <div class="saved-colors">
                ${p.colors.map(c=>`<div class="saved-color" style="background:${c}"></div>`).join('')}
            </div>
            <div class="saved-actions">
                <button onclick="loadPalette(${i})">📂</button>
                <button onclick="deleteSaved(${i})">🗑️</button>
            </div>
        </div>
    `).join('')||'<div style="color:#666;text-align:center">保存したパレットはありません</div>';
}

function loadPalette(i){
    colors=[...saved[i].colors];
    lockedIndices=[];
    render();
}

function deleteSaved(i){
    saved.splice(i,1);
    localStorage.setItem('savedPalettes',JSON.stringify(saved));
    renderSaved();
}

document.addEventListener('keydown',e=>{
    if(e.code==='Space'&&!e.target.matches('input,textarea')){
        e.preventDefault();
        generatePalette();
    }
});

document.getElementById('baseColor').addEventListener('input',generatePalette);
document.getElementById('harmony').addEventListener('change',generatePalette);
document.getElementById('colorCount').addEventListener('change',()=>{
    lockedIndices=[];
    generatePalette();
});

generatePalette();
renderSaved();
