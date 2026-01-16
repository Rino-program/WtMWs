let size=3,tiles=[],emptyIdx,moves=0,startTime=null,timer=null,imageMode=false;
let records=JSON.parse(localStorage.getItem('slidePuzzleRecords')||'{}');
const images=['data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e74c3c" width="100" height="100"/><circle cx="50" cy="50" r="30" fill="%23fff"/></svg>',
'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%233498db" width="100" height="100"/><polygon points="50,20 80,80 20,80" fill="%23fff"/></svg>',
'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%232ecc71" width="100" height="100"/><rect x="25" y="25" width="50" height="50" fill="%23fff"/></svg>'];
let currentImage=images[0];

document.querySelectorAll('.controls button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.controls .active').classList.remove('active');
        this.classList.add('active');
        size=parseInt(this.dataset.size);
        init();
    };
});

function init(){
    moves=0;
    startTime=null;
    clearInterval(timer);
    document.getElementById('moves').textContent='0';
    document.getElementById('time').textContent='0:00';
    updateBest();
    
    tiles=[];
    for(let i=1;i<size*size;i++)tiles.push(i);
    tiles.push(0);
    emptyIdx=size*size-1;
    
    render();
    renderPreview();
}

function render(){
    const puzzle=document.getElementById('puzzle');
    const tileSize=Math.min(70,Math.floor((Math.min(window.innerWidth*0.9,400)-20-(size-1)*4)/size));
    puzzle.style.gridTemplateColumns=`repeat(${size},${tileSize}px)`;
    
    puzzle.innerHTML=tiles.map((n,i)=>{
        const isEmpty=n===0;
        const isCorrect=!isEmpty&&n===i+1;
        let style='';
        if(imageMode&&!isEmpty){
            const correctIdx=n-1;
            const row=Math.floor(correctIdx/size);
            const col=correctIdx%size;
            const bgSize=size*100;
            const bgX=col*100/(size-1);
            const bgY=row*100/(size-1);
            style=`background-image:url("${currentImage}");background-size:${bgSize}% ${bgSize}%;background-position:${bgX}% ${bgY}%`;
        }
        return `<div class="tile ${isEmpty?'empty':'number'}${isCorrect&&!imageMode?' correct':''}${imageMode?' image-mode':''}" 
                     style="width:${tileSize}px;height:${tileSize}px;${style}" 
                     data-idx="${i}" onclick="moveTile(${i})">${isEmpty||imageMode?'':n}</div>`;
    }).join('');
}

function renderPreview(){
    const preview=document.getElementById('previewGrid');
    preview.style.gridTemplateColumns=`repeat(${size},25px)`;
    let html='';
    for(let i=1;i<size*size;i++)html+=`<div class="preview-cell">${i}</div>`;
    html+=`<div class="preview-cell" style="background:transparent"></div>`;
    preview.innerHTML=html;
}

function moveTile(idx){
    if(tiles[idx]===0)return;
    const row=Math.floor(idx/size),col=idx%size;
    const emptyRow=Math.floor(emptyIdx/size),emptyCol=emptyIdx%size;
    const canMove=(Math.abs(row-emptyRow)===1&&col===emptyCol)||(Math.abs(col-emptyCol)===1&&row===emptyRow);
    
    if(canMove){
        if(!startTime){
            startTime=Date.now();
            timer=setInterval(updateTime,1000);
        }
        tiles[emptyIdx]=tiles[idx];
        tiles[idx]=0;
        emptyIdx=idx;
        moves++;
        document.getElementById('moves').textContent=moves;
        render();
        checkWin();
    }
}

function updateTime(){
    if(!startTime)return;
    const elapsed=Math.floor((Date.now()-startTime)/1000);
    const min=Math.floor(elapsed/60);
    const sec=elapsed%60;
    document.getElementById('time').textContent=`${min}:${String(sec).padStart(2,'0')}`;
}

function checkWin(){
    const solved=tiles.every((n,i)=>i===size*size-1?n===0:n===i+1);
    if(solved&&moves>0){
        clearInterval(timer);
        const elapsed=Math.floor((Date.now()-startTime)/1000);
        document.getElementById('finalMoves').textContent=moves;
        const min=Math.floor(elapsed/60);
        const sec=elapsed%60;
        document.getElementById('finalTime').textContent=`${min}:${String(sec).padStart(2,'0')}`;
        
        const key=`${size}x${size}`;
        if(!records[key])records[key]=[];
        records[key].push({moves,time:elapsed,date:Date.now()});
        records[key].sort((a,b)=>a.moves-b.moves);
        records[key]=records[key].slice(0,10);
        localStorage.setItem('slidePuzzleRecords',JSON.stringify(records));
        updateBest();
        renderLeaderboard();
        
        document.getElementById('winModal').classList.add('active');
    }
}

function closeModal(){
    document.getElementById('winModal').classList.remove('active');
}

function shuffle(){
    init();
    for(let i=0;i<size*300;i++){
        const neighbors=[];
        const row=Math.floor(emptyIdx/size),col=emptyIdx%size;
        if(row>0)neighbors.push(emptyIdx-size);
        if(row<size-1)neighbors.push(emptyIdx+size);
        if(col>0)neighbors.push(emptyIdx-1);
        if(col<size-1)neighbors.push(emptyIdx+1);
        const randIdx=neighbors[Math.floor(Math.random()*neighbors.length)];
        tiles[emptyIdx]=tiles[randIdx];
        tiles[randIdx]=0;
        emptyIdx=randIdx;
    }
    render();
}

function toggleMode(){
    imageMode=!imageMode;
    render();
}

function showHint(){
    for(let i=0;i<tiles.length;i++){
        if(tiles[i]===0)continue;
        const target=tiles[i]-1;
        if(i!==target){
            const tile=document.querySelector(`[data-idx="${i}"]`);
            tile.style.boxShadow='0 0 15px #f39c12';
            setTimeout(()=>tile.style.boxShadow='',1500);
            break;
        }
    }
}

function updateBest(){
    const key=`${size}x${size}`;
    const best=records[key]&&records[key][0];
    document.getElementById('best').textContent=best?`${best.moves}手`:'-';
}

function renderLeaderboard(){
    const key=`${size}x${size}`;
    const list=records[key]||[];
    document.getElementById('leaderboardList').innerHTML=list.slice(0,5).map((r,i)=>`
        <div class="rank-item">
            <span class="rank-num">#${i+1}</span>
            <span>${r.moves}手</span>
            <span style="color:#888">${Math.floor(r.time/60)}:${String(r.time%60).padStart(2,'0')}</span>
        </div>
    `).join('')||'<div style="color:#666;text-align:center">まだ記録がありません</div>';
}

window.addEventListener('resize',render);
document.addEventListener('keydown',e=>{
    const row=Math.floor(emptyIdx/size),col=emptyIdx%size;
    let targetIdx=-1;
    if(e.key==='ArrowUp'&&row<size-1)targetIdx=emptyIdx+size;
    if(e.key==='ArrowDown'&&row>0)targetIdx=emptyIdx-size;
    if(e.key==='ArrowLeft'&&col<size-1)targetIdx=emptyIdx+1;
    if(e.key==='ArrowRight'&&col>0)targetIdx=emptyIdx-1;
    if(targetIdx>=0){e.preventDefault();moveTile(targetIdx);}
});

init();
renderLeaderboard();
