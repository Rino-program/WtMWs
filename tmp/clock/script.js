const face=document.getElementById('face');
const themes={
blue:{primary:'#4facfe',secondary:'#00f2fe',accent:'#f093fb'},
pink:{primary:'#f093fb',secondary:'#f5576c',accent:'#4facfe'},
green:{primary:'#43e97b',secondary:'#38f9d7',accent:'#f5576c'},
sunset:{primary:'#fa709a',secondary:'#fee140',accent:'#43e97b'}
};
let theme=themes.blue;

// 目盛り作成
for(let i=0;i<60;i++){
const tick=document.createElement('div');
tick.className='tick'+(i%5===0?' hour':'');
tick.style.transform=`translateX(-50%) rotate(${i*6}deg)`;
tick.style.transformOrigin=`center ${face.offsetWidth/2-10}px`;
face.appendChild(tick);
}

function setTheme(name){
theme=themes[name];
document.documentElement.style.setProperty('--primary',theme.primary);
document.querySelectorAll('.tick').forEach(t=>t.style.background=theme.primary);
document.querySelector('.digital').style.color=theme.primary;
document.querySelector('.digital').style.textShadow=`0 0 20px ${theme.primary},0 0 40px ${theme.primary}`;
}

function updateClock(){
const now=new Date();
const h=now.getHours()%12,m=now.getMinutes(),s=now.getSeconds(),ms=now.getMilliseconds();
const hDeg=h*30+m*0.5;
const mDeg=m*6+s*0.1;
const sDeg=s*6+ms*0.006;
document.getElementById('hour').style.transform=`translateX(-50%) rotate(${hDeg}deg)`;
document.getElementById('minute').style.transform=`translateX(-50%) rotate(${mDeg}deg)`;
document.getElementById('second').style.transform=`translateX(-50%) rotate(${sDeg}deg)`;
const hh=String(now.getHours()).padStart(2,'0');
const mm=String(m).padStart(2,'0');
const ss=String(s).padStart(2,'0');
document.getElementById('digital').textContent=`${hh}:${mm}:${ss}`;
const days=['日','月','火','水','木','金','土'];
document.getElementById('date').textContent=`${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} (${days[now.getDay()]})`;
requestAnimationFrame(updateClock);
}
updateClock();

// パーティクル背景
const cv=document.getElementById('particles'),ctx=cv.getContext('2d');
let W,H,pts=[];
function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight}
resize();window.onresize=resize;
for(let i=0;i<50;i++)pts.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5,r:Math.random()*2+1});
function drawParticles(){
ctx.clearRect(0,0,W,H);
pts.forEach(p=>{
p.x+=p.vx;p.y+=p.vy;
if(p.x<0||p.x>W)p.vx*=-1;
if(p.y<0||p.y>H)p.vy*=-1;
ctx.beginPath();
ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
ctx.fillStyle=`rgba(79,172,254,0.5)`;
ctx.fill();
});
requestAnimationFrame(drawParticles);
}
drawParticles();
