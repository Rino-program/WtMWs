const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
let W,H,cx,cy,segments=8,lineW=4,alpha=0.03,mode='free';
let isDrawing=false,lastX=0,lastY=0,hue=0,autoAngle=0,time=0;

function resize(){
    W=cv.width=innerWidth;H=cv.height=innerHeight;
    cx=W/2;cy=H/2;
    ctx.fillStyle='#111';ctx.fillRect(0,0,W,H);
}
resize();window.onresize=resize;

document.getElementById('segments').oninput=function(){
    segments=+this.value;
    document.getElementById('segInfo').textContent=segments;
};
document.getElementById('lineW').oninput=function(){lineW=+this.value};
document.getElementById('alpha').oninput=function(){alpha=+this.value};
document.getElementById('mode').onchange=function(){
    mode=this.value;
    document.getElementById('modeInfo').textContent=this.options[this.selectedIndex].text;
};

function clearCanvas(){
    ctx.fillStyle='#111';ctx.fillRect(0,0,W,H);
}

function drawMirror(x,y,px,py){
    const dx=x-cx,dy=y-cy;
    const pdx=px-cx,pdy=py-cy;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const angle=Math.atan2(dy,dx);
    const pAngle=Math.atan2(pdy,pdx);
    const pDist=Math.sqrt(pdx*pdx+pdy*pdy);
    
    ctx.lineWidth=lineW;
    ctx.lineCap='round';
    ctx.strokeStyle=`hsla(${hue},80%,60%,0.8)`;
    
    for(let i=0;i<segments;i++){
        const baseAngle=(Math.PI*2/segments)*i;
        // 通常
        const a1=baseAngle+angle,pa1=baseAngle+pAngle;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(pa1)*pDist,cy+Math.sin(pa1)*pDist);
        ctx.lineTo(cx+Math.cos(a1)*dist,cy+Math.sin(a1)*dist);
        ctx.stroke();
        // 鏡像
        const a2=baseAngle-angle,pa2=baseAngle-pAngle;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(pa2)*pDist,cy+Math.sin(pa2)*pDist);
        ctx.lineTo(cx+Math.cos(a2)*dist,cy+Math.sin(a2)*dist);
        ctx.stroke();
    }
    hue=(hue+1)%360;
}

cv.onmousedown=cv.ontouchstart=function(e){
    e.preventDefault();
    if(mode!=='free')return;
    isDrawing=true;
    const p=e.touches?e.touches[0]:e;
    lastX=p.clientX;lastY=p.clientY;
    document.getElementById('tip').classList.add('hide');
};
cv.onmousemove=cv.ontouchmove=function(e){
    if(!isDrawing||mode!=='free')return;
    e.preventDefault();
    const p=e.touches?e.touches[0]:e;
    drawMirror(p.clientX,p.clientY,lastX,lastY);
    lastX=p.clientX;lastY=p.clientY;
};
cv.onmouseup=cv.ontouchend=cv.onmouseleave=function(){isDrawing=false};

function autoMode(){
    const r=100+Math.sin(time*0.02)*80;
    const x=cx+Math.cos(autoAngle)*r;
    const y=cy+Math.sin(autoAngle)*r;
    const px=cx+Math.cos(autoAngle-0.1)*r;
    const py=cy+Math.sin(autoAngle-0.1)*r;
    drawMirror(x,y,px,py);
    autoAngle+=0.05+Math.sin(time*0.01)*0.03;
}

function spiralMode(){
    const r=(time%300)*0.8;
    const a=time*0.1;
    const x=cx+Math.cos(a)*r;
    const y=cy+Math.sin(a)*r;
    const px=cx+Math.cos(a-0.1)*(r-0.8);
    const py=cy+Math.sin(a-0.1)*(r-0.8);
    if(r<Math.min(W,H)/2)drawMirror(x,y,px,py);
}

function burstMode(){
    if(time%10===0){
        const a=Math.random()*Math.PI*2;
        const r=Math.random()*200+50;
        const x=cx+Math.cos(a)*r;
        const y=cy+Math.sin(a)*r;
        drawMirror(x,y,cx,cy);
    }
}

function animate(){
    ctx.fillStyle=`rgba(17,17,17,${alpha})`;
    ctx.fillRect(0,0,W,H);
    time++;
    if(mode==='auto')autoMode();
    else if(mode==='spiral')spiralMode();
    else if(mode==='burst')burstMode();
    requestAnimationFrame(animate);
}
animate();

setTimeout(()=>document.getElementById('tip').classList.add('hide'),3000);
