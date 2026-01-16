const cv=document.getElementById('mainCanvas'),ctx=cv.getContext('2d');
let W,H,drawing=false,color='#ffffff',size=5,opacity=1,tool='pen',brush='pencil';
let hardness=100,flow=100;
let lastX,lastY,startX,startY,showGrid=false,saveFormat='png';
let history=[],historyIndex=-1,maxHistory=30;
let layers=[{name:'レイヤー1',visible:true,opacity:1,canvas:null}];
let activeLayer=0,textPos=null;
let customBrushes=JSON.parse(localStorage.getItem('customBrushes')||'[]');
let animationId=null;
let strokePoints=[];

// ブラシプリセット定義
const brushPresets={
    pencil:{name:'鉛筆',icon:'✏️',size:3,opacity:40,hardness:90,flow:30,lineCap:'round'},
    pen:{name:'ペン',icon:'🖊️',size:5,opacity:100,hardness:100,flow:100,lineCap:'round'},
    marker:{name:'マーカー',icon:'🖍️',size:15,opacity:60,hardness:80,flow:80,lineCap:'square'},
    watercolor:{name:'水彩',icon:'💧',size:20,opacity:30,hardness:20,flow:40,lineCap:'round'},
    airbrush:{name:'エアブラシ',icon:'💨',size:30,opacity:20,hardness:10,flow:20,lineCap:'round'},
    crayon:{name:'クレヨン',icon:'🖍️',size:12,opacity:70,hardness:60,flow:60,lineCap:'round'},
    highlighter:{name:'蛍光ペン',icon:'🌟',size:20,opacity:40,hardness:50,flow:80,lineCap:'square'}
};

function resize(){
    W=cv.width=innerWidth;
    H=cv.height=innerHeight-50;
    cv.style.top='50px';
    redraw();
    updateCanvasInfo();
}

function initLayers(){
    layers[0].canvas=document.createElement('canvas');
    layers[0].canvas.width=W;
    layers[0].canvas.height=H;
    const lctx=layers[0].canvas.getContext('2d');
    lctx.fillStyle='#1a1a2e';
    lctx.fillRect(0,0,W,H);
    renderLayersList();
}

function redraw(){
    ctx.fillStyle='#1a1a2e';
    ctx.fillRect(0,0,W,H);
    layers.forEach(layer=>{
        if(layer.visible&&layer.canvas){
            ctx.globalAlpha=layer.opacity;
            ctx.drawImage(layer.canvas,0,0);
        }
    });
    ctx.globalAlpha=1;
    if(showGrid)drawGrid();
}

function drawGrid(){
    ctx.strokeStyle='rgba(255,255,255,0.1)';
    ctx.lineWidth=0.5;
    const gridSize=50;
    for(let x=0;x<W;x+=gridSize){
        ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
    }
    for(let y=0;y<H;y+=gridSize){
        ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
}

function getLayerCtx(){
    return layers[activeLayer].canvas.getContext('2d');
}

function saveToHistory(){
    const imgData=getLayerCtx().getImageData(0,0,W,H);
    history=history.slice(0,historyIndex+1);
    history.push(imgData);
    if(history.length>maxHistory)history.shift();
    historyIndex=history.length-1;
    updateHistoryInfo();
}

function undo(){
    if(historyIndex>0){
        historyIndex--;
        getLayerCtx().putImageData(history[historyIndex],0,0);
        redraw();
        updateHistoryInfo();
    }
}

function redo(){
    if(historyIndex<history.length-1){
        historyIndex++;
        getLayerCtx().putImageData(history[historyIndex],0,0);
        redraw();
        updateHistoryInfo();
    }
}

function updateHistoryInfo(){
    document.getElementById('historyInfo').textContent=`履歴: ${historyIndex+1}/${history.length}`;
}

function updateCanvasInfo(){
    document.getElementById('canvasInfo').textContent=`${W} × ${H}`;
}

// ブラシパネル関連
function toggleBrushPanel(){
    document.getElementById('brushPanel').classList.toggle('show');
    updateBrushPreview();
}

function selectBrush(brushType,isCustom=false){
    brush=brushType;
    if(!isCustom&&brushPresets[brushType]){
        const preset=brushPresets[brushType];
        size=preset.size;
        opacity=preset.opacity/100;
        hardness=preset.hardness;
        flow=preset.flow;
        updateBrushUI();
    }else if(isCustom){
        const custom=customBrushes.find(b=>b.name===brushType);
        if(custom){
            size=custom.size;
            opacity=custom.opacity/100;
            hardness=custom.hardness;
            flow=custom.flow;
            updateBrushUI();
        }
    }
    updateBrushPresetUI();
    updateBrushPreview();
    updateBrushInfo();
}

function updateBrushUI(){
    document.getElementById('brushSize').value=size;
    document.getElementById('brushSizeNum').value=size;
    document.getElementById('brushOpacity').value=opacity*100;
    document.getElementById('brushOpacityVal').textContent=Math.round(opacity*100)+'%';
    document.getElementById('brushHardness').value=hardness;
    document.getElementById('brushHardnessVal').textContent=hardness+'%';
    document.getElementById('brushFlow').value=flow;
    document.getElementById('brushFlowVal').textContent=flow+'%';
}

function updateBrushPresetUI(){
    document.querySelectorAll('.brush-preset-item').forEach(el=>{
        el.classList.remove('active');
        if(el.dataset.brush===brush)el.classList.add('active');
    });
    document.querySelectorAll('.custom-brush-item').forEach(el=>{
        el.classList.remove('active');
        if(el.dataset.brush===brush)el.classList.add('active');
    });
}

function updateBrushPreview(){
    const canvas=document.getElementById('brushPreview');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#111';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
    // ストローク例を描画
    const startX=20,startY=40,endX=180,endY=40;
    drawPreviewStroke(ctx,startX,startY,endX,endY);
    
    // サイズインジケーター
    ctx.beginPath();
    ctx.arc(canvas.width-25,canvas.height-25,Math.min(size/2,15),0,Math.PI*2);
    ctx.fillStyle=color;
    ctx.globalAlpha=opacity;
    ctx.fill();
    ctx.globalAlpha=1;
}

function drawPreviewStroke(previewCtx,x1,y1,x2,y2){
    const steps=20;
    previewCtx.save();
    
    for(let i=0;i<steps;i++){
        const t=i/steps;
        const x=x1+(x2-x1)*t;
        const y=y1+Math.sin(t*Math.PI*2)*10;
        const prevX=i===0?x:x1+(x2-x1)*((i-1)/steps);
        const prevY=i===0?y:y1+Math.sin(((i-1)/steps)*Math.PI*2)*10;
        
        drawBrushStroke(previewCtx,prevX,prevY,x,y,true);
    }
    
    previewCtx.restore();
}

function drawBrushStroke(targetCtx,fromX,fromY,toX,toY,isPreview=false){
    const effectiveOpacity=opacity*(flow/100);
    targetCtx.globalAlpha=effectiveOpacity;
    
    switch(brush){
        case'pencil':
            drawPencilStroke(targetCtx,fromX,fromY,toX,toY);
            break;
        case'pen':
            drawPenStroke(targetCtx,fromX,fromY,toX,toY);
            break;
        case'marker':
            drawMarkerStroke(targetCtx,fromX,fromY,toX,toY);
            break;
        case'watercolor':
            drawWatercolorStroke(targetCtx,fromX,fromY,toX,toY,isPreview);
            break;
        case'airbrush':
            drawAirbrushStroke(targetCtx,fromX,fromY,toX,toY);
            break;
        case'crayon':
            drawCrayonStroke(targetCtx,fromX,fromY,toX,toY);
            break;
        case'highlighter':
            drawHighlighterStroke(targetCtx,fromX,fromY,toX,toY);
            break;
        default:
            drawPenStroke(targetCtx,fromX,fromY,toX,toY);
    }
    
    targetCtx.globalAlpha=1;
}

function drawPencilStroke(ctx,x1,y1,x2,y2){
    const strokeColor=tool==='eraser'?'#1a1a2e':color;
    ctx.strokeStyle=strokeColor;
    ctx.lineWidth=size*0.8;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.globalAlpha*=0.4;
    
    // 細い線でシャープな質感
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    
    // ノイズを追加してテクスチャ感
    for(let i=0;i<2;i++){
        const offsetX=(Math.random()-0.5)*size*0.3;
        const offsetY=(Math.random()-0.5)*size*0.3;
        ctx.beginPath();
        ctx.moveTo(x1+offsetX,y1+offsetY);
        ctx.lineTo(x2+offsetX,y2+offsetY);
        ctx.lineWidth=size*0.2;
        ctx.globalAlpha*=0.3;
        ctx.stroke();
    }
}

function drawPenStroke(ctx,x1,y1,x2,y2){
    const strokeColor=tool==='eraser'?'#1a1a2e':color;
    ctx.strokeStyle=strokeColor;
    ctx.lineWidth=size;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

function drawMarkerStroke(ctx,x1,y1,x2,y2){
    const strokeColor=tool==='eraser'?'#1a1a2e':color;
    ctx.strokeStyle=strokeColor;
    ctx.lineWidth=size*1.5;
    ctx.lineCap='square';
    ctx.lineJoin='miter';
    ctx.globalAlpha*=0.6;
    
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}

function drawWatercolorStroke(ctx,x1,y1,x2,y2,isPreview=false){
    const strokeColor=tool==='eraser'?'#1a1a2e':color;
    const rgb=hexToRgb(strokeColor);
    
    // 滲み効果 - 複数のレイヤーで表現
    const layers=isPreview?3:5;
    for(let i=0;i<layers;i++){
        const spread=size*(1+i*0.3);
        const alpha=0.15/(i+1);
        
        ctx.beginPath();
        ctx.moveTo(x1+(Math.random()-0.5)*spread*0.5,y1+(Math.random()-0.5)*spread*0.5);
        ctx.lineTo(x2+(Math.random()-0.5)*spread*0.5,y2+(Math.random()-0.5)*spread*0.5);
        ctx.strokeStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
        ctx.lineWidth=spread;
        ctx.lineCap='round';
        ctx.stroke();
    }
    
    // 中心の濃い部分
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.strokeStyle=strokeColor;
    ctx.lineWidth=size*0.5;
    ctx.globalAlpha*=0.4;
    ctx.stroke();
}

function drawAirbrushStroke(ctx,x1,y1,x2,y2){
    const strokeColor=tool==='eraser'?'#1a1a2e':color;
    const rgb=hexToRgb(strokeColor);
    const dist=Math.hypot(x2-x1,y2-y1);
    const particles=Math.max(10,Math.floor(dist*2));
    
    for(let i=0;i<particles;i++){
        const t=i/particles;
        const x=x1+(x2-x1)*t;
        const y=y1+(y2-y1)*t;
        
        const angle=Math.random()*Math.PI*2;
        const radius=Math.random()*size;
        const px=x+Math.cos(angle)*radius;
        const py=y+Math.sin(angle)*radius;
        const particleSize=Math.random()*2+0.5;
        const alpha=0.1*(1-radius/size);
        
        ctx.beginPath();
        ctx.arc(px,py,particleSize,0,Math.PI*2);
        ctx.fillStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
        ctx.fill();
    }
}

function drawCrayonStroke(ctx,x1,y1,x2,y2){
    const strokeColor=tool==='eraser'?'#1a1a2e':color;
    ctx.strokeStyle=strokeColor;
    ctx.lineWidth=size;
    ctx.lineCap='round';
    ctx.globalAlpha*=0.7;
    
    // メインストローク
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    
    // テクスチャ効果 - ランダムなギャップ
    const rgb=hexToRgb(strokeColor);
    const dist=Math.hypot(x2-x1,y2-y1);
    const gaps=Math.floor(dist/3);
    
    for(let i=0;i<gaps;i++){
        const t=Math.random();
        const x=x1+(x2-x1)*t+(Math.random()-0.5)*size*0.5;
        const y=y1+(y2-y1)*t+(Math.random()-0.5)*size*0.5;
        const gapSize=Math.random()*size*0.4;
        
        ctx.beginPath();
        ctx.arc(x,y,gapSize,0,Math.PI*2);
        ctx.fillStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.random()*0.3})`;
        ctx.fill();
    }
}

function drawHighlighterStroke(ctx,x1,y1,x2,y2){
    const strokeColor=tool==='eraser'?'#1a1a2e':color;
    const rgb=hexToRgb(strokeColor);
    
    // 明るい半透明の太い線
    ctx.strokeStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.4)`;
    ctx.lineWidth=size*1.5;
    ctx.lineCap='square';
    ctx.lineJoin='miter';
    
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    
    // 縁を少し明るく
    ctx.strokeStyle=`rgba(255,255,255,0.1)`;
    ctx.lineWidth=size*1.5+2;
    ctx.globalCompositeOperation='lighter';
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    ctx.globalCompositeOperation='source-over';
}

// カスタムブラシ関連
function saveCustomBrush(){
    const name=document.getElementById('customBrushName').value.trim();
    if(!name){
        alert('ブラシ名を入力してください');
        return;
    }
    
    const existingIndex=customBrushes.findIndex(b=>b.name===name);
    const brushData={
        name,
        size,
        opacity:Math.round(opacity*100),
        hardness,
        flow,
        createdAt:Date.now()
    };
    
    if(existingIndex>=0){
        customBrushes[existingIndex]=brushData;
    }else{
        customBrushes.push(brushData);
    }
    
    localStorage.setItem('customBrushes',JSON.stringify(customBrushes));
    renderCustomBrushes();
    document.getElementById('customBrushName').value='';
}

function deleteCustomBrush(name){
    if(!confirm(`"${name}"を削除しますか？`))return;
    customBrushes=customBrushes.filter(b=>b.name!==name);
    localStorage.setItem('customBrushes',JSON.stringify(customBrushes));
    renderCustomBrushes();
    if(brush===name)selectBrush('pen');
}

function renderCustomBrushes(){
    const container=document.getElementById('customBrushes');
    if(!container)return;
    
    container.innerHTML=customBrushes.map(b=>`
        <div class="custom-brush-item${brush===b.name?' active':''}" data-brush="${b.name}" onclick="selectBrush('${b.name}',true)">
            <span>🎨 ${b.name}</span>
            <button class="delete-btn" onclick="event.stopPropagation();deleteCustomBrush('${b.name}')">×</button>
        </div>
    `).join('');
}

function updateBrushInfo(){
    const indicator=document.getElementById('brushIndicator');
    const nameEl=document.getElementById('currentBrushName');
    const sizeEl=document.getElementById('currentBrushSize');
    
    if(indicator&&nameEl&&sizeEl){
        let icon='🎨',name=brush;
        if(brushPresets[brush]){
            icon=brushPresets[brush].icon;
            name=brushPresets[brush].name;
        }
        indicator.textContent=icon;
        nameEl.textContent=name;
        sizeEl.textContent=size+'px';
    }
}

function updateSizeDot(){
    const dot=document.getElementById('sizeDot');
    if(dot){
        const d=Math.min(Math.max(3,size),25);
        dot.style.cssText=`width:${d}px;height:${d}px`;
    }
    updateBrushInfo();
}

function updateToolBtns(){
    document.querySelectorAll('.toolbar button').forEach(b=>b.classList.remove('active'));
    const btnMap={pen:'penBtn',eraser:'eraserBtn',fill:'fillBtn',picker:'pickerBtn',line:'lineBtn',rect:'rectBtn',circle:'circleBtn',text:'textBtn'};
    if(btnMap[tool])document.getElementById(btnMap[tool]).classList.add('active');
}

function renderLayersList(){
    document.getElementById('layersList').innerHTML=layers.map((l,i)=>`
        <div class="layer-item${i===activeLayer?' active':''}" onclick="selectLayer(${i})">
            <input type="checkbox" ${l.visible?'checked':''} onclick="event.stopPropagation();toggleLayerVisibility(${i})">
            <span class="layer-name">${l.name}</span>
            <input type="range" min="0" max="100" value="${l.opacity*100}" onclick="event.stopPropagation()" oninput="setLayerOpacity(${i},this.value)">
        </div>
    `).join('');
}

function addLayer(){
    if(layers.length>=5)return alert('最大5レイヤーまでです');
    const newCanvas=document.createElement('canvas');
    newCanvas.width=W;
    newCanvas.height=H;
    layers.push({name:`レイヤー${layers.length+1}`,visible:true,opacity:1,canvas:newCanvas});
    activeLayer=layers.length-1;
    renderLayersList();
}

function selectLayer(i){
    activeLayer=i;
    renderLayersList();
}

function toggleLayerVisibility(i){
    layers[i].visible=!layers[i].visible;
    redraw();
    renderLayersList();
}

function setLayerOpacity(i,val){
    layers[i].opacity=val/100;
    redraw();
}

// Drawing functions
function draw(x,y){
    const lctx=getLayerCtx();
    
    // requestAnimationFrameを使用した滑らかなストローク
    strokePoints.push({x,y,time:performance.now()});
    
    if(!animationId){
        animationId=requestAnimationFrame(()=>processStroke(lctx));
    }
}

function processStroke(lctx){
    if(strokePoints.length<2){
        animationId=null;
        return;
    }
    
    const from=strokePoints[0];
    const to=strokePoints[1];
    
    // 滑らかな線のための補間
    const dist=Math.hypot(to.x-from.x,to.y-from.y);
    const steps=Math.max(1,Math.floor(dist/2));
    
    for(let i=0;i<steps;i++){
        const t=i/steps;
        const x=from.x+(to.x-from.x)*t;
        const y=from.y+(to.y-from.y)*t;
        const prevX=i===0?lastX:from.x+(to.x-from.x)*((i-1)/steps);
        const prevY=i===0?lastY:from.y+(to.y-from.y)*((i-1)/steps);
        
        drawBrushStroke(lctx,prevX,prevY,x,y);
    }
    
    lastX=to.x;
    lastY=to.y;
    strokePoints.shift();
    redraw();
    
    if(strokePoints.length>=2){
        animationId=requestAnimationFrame(()=>processStroke(lctx));
    }else{
        animationId=null;
    }
}

function drawShape(x,y,preview=false){
    const targetCtx=preview?ctx:getLayerCtx();
    if(preview)redraw();
    
    targetCtx.strokeStyle=color;
    targetCtx.fillStyle=color;
    targetCtx.lineWidth=size;
    targetCtx.globalAlpha=opacity;
    
    if(tool==='line'){
        targetCtx.beginPath();
        targetCtx.moveTo(startX,startY);
        targetCtx.lineTo(x,y);
        targetCtx.stroke();
    }else if(tool==='rect'){
        targetCtx.strokeRect(startX,startY,x-startX,y-startY);
    }else if(tool==='circle'){
        const rx=Math.abs(x-startX)/2;
        const ry=Math.abs(y-startY)/2;
        const cx=startX+(x-startX)/2;
        const cy=startY+(y-startY)/2;
        targetCtx.beginPath();
        targetCtx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
        targetCtx.stroke();
    }
    targetCtx.globalAlpha=1;
}

function floodFill(sx,sy,fillColor){
    const lctx=getLayerCtx();
    const img=lctx.getImageData(0,0,W,H);
    const data=img.data;
    const idx=(sy*W+sx)*4;
    const target=[data[idx],data[idx+1],data[idx+2]];
    const fill=hexToRgb(fillColor);
    if(target[0]===fill[0]&&target[1]===fill[1]&&target[2]===fill[2])return;
    
    const stack=[[sx,sy]];
    const visited=new Set();
    while(stack.length){
        const[x,y]=stack.pop();
        if(x<0||x>=W||y<0||y>=H)continue;
        const key=x+','+y;
        if(visited.has(key))continue;
        const i=(y*W+x)*4;
        if(Math.abs(data[i]-target[0])>30||Math.abs(data[i+1]-target[1])>30||Math.abs(data[i+2]-target[2])>30)continue;
        visited.add(key);
        data[i]=fill[0];data[i+1]=fill[1];data[i+2]=fill[2];data[i+3]=255*opacity;
        stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    lctx.putImageData(img,0,0);
    redraw();
}

function pickColor(x,y){
    const pixel=ctx.getImageData(x,y,1,1).data;
    color='#'+[pixel[0],pixel[1],pixel[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
    document.getElementById('customColor').value=color;
    document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('active'));
    tool='pen';
    updateToolBtns();
}

function hexToRgb(hex){
    return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
}

// Event handlers
function handleStart(e){
    e.preventDefault();
    const p=e.touches?e.touches[0]:e;
    const x=p.clientX,y=p.clientY-50;
    startX=lastX=x;startY=lastY=y;
    
    if(tool==='fill'){
        saveToHistory();
        floodFill(x|0,y|0,color);
    }else if(tool==='picker'){
        pickColor(x|0,y|0);
    }else if(tool==='text'){
        textPos={x,y};
        document.getElementById('textModal').classList.add('show');
    }else{
        drawing=true;
        if(['pen','eraser'].includes(tool))saveToHistory();
    }
}

function handleMove(e){
    if(!drawing)return;
    e.preventDefault();
    const p=e.touches?e.touches[0]:e;
    const x=p.clientX,y=p.clientY-50;
    
    if(['line','rect','circle'].includes(tool)){
        drawShape(x,y,true);
    }else{
        draw(x,y);
    }
}

function handleEnd(e){
    if(!drawing)return;
    drawing=false;
    strokePoints=[];
    if(animationId){
        cancelAnimationFrame(animationId);
        animationId=null;
    }
    if(['line','rect','circle'].includes(tool)){
        const p=e.changedTouches?e.changedTouches[0]:e;
        const x=p.clientX,y=p.clientY-50;
        saveToHistory();
        drawShape(x,y,false);
        redraw();
    }
}

function insertText(){
    if(!textPos)return;
    const text=document.getElementById('textInput').value;
    if(!text)return;
    const fontSize=document.getElementById('fontSize').value;
    const fontFamily=document.getElementById('fontFamily').value;
    
    saveToHistory();
    const lctx=getLayerCtx();
    lctx.font=`${fontSize}px ${fontFamily}`;
    lctx.fillStyle=color;
    lctx.globalAlpha=opacity;
    lctx.fillText(text,textPos.x,textPos.y);
    lctx.globalAlpha=1;
    redraw();
    closeModal();
    document.getElementById('textInput').value='';
}

function closeModal(){
    document.querySelectorAll('.modal').forEach(m=>m.classList.remove('show'));
}

function applySettings(){
    const newW=+document.getElementById('canvasWidth').value||W;
    const newH=+document.getElementById('canvasHeight').value||H;
    saveFormat=document.getElementById('saveFormat').value;
    if(newW!==W||newH!==H){
        layers.forEach(l=>{
            const newCanvas=document.createElement('canvas');
            newCanvas.width=newW;
            newCanvas.height=newH;
            const nctx=newCanvas.getContext('2d');
            nctx.fillStyle='#1a1a2e';
            nctx.fillRect(0,0,newW,newH);
            nctx.drawImage(l.canvas,0,0);
            l.canvas=newCanvas;
        });
        W=newW;H=newH;
        cv.width=W;cv.height=H;
        redraw();
        updateCanvasInfo();
    }
    closeModal();
}

function save(){
    const tempCanvas=document.createElement('canvas');
    tempCanvas.width=W;
    tempCanvas.height=H;
    const tempCtx=tempCanvas.getContext('2d');
    if(saveFormat==='jpeg'){
        tempCtx.fillStyle='#1a1a2e';
        tempCtx.fillRect(0,0,W,H);
    }
    layers.forEach(l=>{
        if(l.visible){
            tempCtx.globalAlpha=l.opacity;
            tempCtx.drawImage(l.canvas,0,0);
        }
    });
    const a=document.createElement('a');
    a.download=`painting.${saveFormat}`;
    a.href=tempCanvas.toDataURL(`image/${saveFormat}`);
    a.click();
}

// UI bindings
document.getElementById('customColor').oninput=e=>{
    color=e.target.value;
    document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('active'));
    updateBrushPreview();
};

document.querySelectorAll('.color-btn').forEach(btn=>{
    btn.onclick=function(){
        document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        color=this.dataset.c;
        if(tool==='eraser'){tool='pen';updateToolBtns()}
        updateBrushPreview();
    };
});

// ブラシパネルボタン
document.getElementById('brushPanelBtn').onclick=toggleBrushPanel;

// ブラシプリセット選択
document.querySelectorAll('.brush-preset-item').forEach(btn=>{
    btn.onclick=function(){
        selectBrush(this.dataset.brush);
    };
});

// ブラシ設定スライダー
document.getElementById('brushSize').oninput=e=>{
    size=+e.target.value;
    document.getElementById('brushSizeNum').value=size;
    updateSizeDot();
    updateBrushPreview();
};
document.getElementById('brushSizeNum').oninput=e=>{
    size=Math.min(100,Math.max(1,+e.target.value||1));
    document.getElementById('brushSize').value=size;
    updateSizeDot();
    updateBrushPreview();
};
document.getElementById('brushOpacity').oninput=e=>{
    opacity=e.target.value/100;
    document.getElementById('brushOpacityVal').textContent=Math.round(opacity*100)+'%';
    updateBrushPreview();
};
document.getElementById('brushHardness').oninput=e=>{
    hardness=+e.target.value;
    document.getElementById('brushHardnessVal').textContent=hardness+'%';
    updateBrushPreview();
};
document.getElementById('brushFlow').oninput=e=>{
    flow=+e.target.value;
    document.getElementById('brushFlowVal').textContent=flow+'%';
    updateBrushPreview();
};

// カスタムブラシ保存
document.getElementById('saveCustomBrush').onclick=saveCustomBrush;

document.getElementById('penBtn').onclick=()=>{tool='pen';updateToolBtns()};
document.getElementById('eraserBtn').onclick=()=>{tool='eraser';updateToolBtns()};
document.getElementById('fillBtn').onclick=()=>{tool='fill';updateToolBtns()};
document.getElementById('pickerBtn').onclick=()=>{tool='picker';updateToolBtns()};
document.getElementById('lineBtn').onclick=()=>{tool='line';updateToolBtns()};
document.getElementById('rectBtn').onclick=()=>{tool='rect';updateToolBtns()};
document.getElementById('circleBtn').onclick=()=>{tool='circle';updateToolBtns()};
document.getElementById('textBtn').onclick=()=>{tool='text';updateToolBtns()};
document.getElementById('undoBtn').onclick=undo;
document.getElementById('redoBtn').onclick=redo;
document.getElementById('gridBtn').onclick=()=>{showGrid=!showGrid;redraw()};
document.getElementById('clearBtn').onclick=()=>{
    if(confirm('キャンバスをクリアしますか？')){
        saveToHistory();
        const lctx=getLayerCtx();
        lctx.fillStyle='#1a1a2e';
        lctx.fillRect(0,0,W,H);
        redraw();
    }
};
document.getElementById('saveBtn').onclick=save;
document.getElementById('settingsBtn').onclick=()=>document.getElementById('settingsModal').classList.add('show');
document.getElementById('helpBtn').onclick=()=>document.getElementById('shortcutsHelp').classList.toggle('show');

// Keyboard shortcuts
document.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT')return;
    if(e.ctrlKey||e.metaKey){
        if(e.key==='z'){e.preventDefault();undo()}
        if(e.key==='y'){e.preventDefault();redo()}
        if(e.key==='s'){e.preventDefault();save()}
        return;
    }
    switch(e.key.toLowerCase()){
        case'b':tool='pen';break;
        case'e':tool='eraser';break;
        case'g':tool='fill';break;
        case'i':tool='picker';break;
        case'l':tool='line';break;
        case'r':tool='rect';break;
        case'c':tool='circle';break;
        case't':tool='text';break;
        case'p':toggleBrushPanel();break;
        case'[':size=Math.max(1,size-5);updateBrushUI();updateSizeDot();updateBrushPreview();break;
        case']':size=Math.min(100,size+5);updateBrushUI();updateSizeDot();updateBrushPreview();break;
        case'?':document.getElementById('shortcutsHelp').classList.toggle('show');break;
        default:return;
    }
    updateToolBtns();
});

// Canvas events
cv.addEventListener('mousedown',handleStart);
cv.addEventListener('mousemove',handleMove);
cv.addEventListener('mouseup',handleEnd);
cv.addEventListener('mouseleave',handleEnd);
cv.addEventListener('touchstart',handleStart,{passive:false});
cv.addEventListener('touchmove',handleMove,{passive:false});
cv.addEventListener('touchend',handleEnd);

// Init
resize();
window.onresize=resize;
initLayers();
updateSizeDot();
saveToHistory();
selectBrush('pencil');
renderCustomBrushes();
updateBrushPreview();
