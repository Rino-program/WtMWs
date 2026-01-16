// 正しいQRコード生成ライブラリ（Reed-Solomon使用）
const QRCode=(function(){
    // QRコード生成に必要な定数とテーブル
    const EC_LEVEL={L:1,M:0,Q:3,H:2};
    const MODE_BYTE=4;
    const PAD0=0xEC,PAD1=0x11;
    
    // ガロア体（GF(256)）の対数表と指数表
    const EXP_TABLE=new Uint8Array(256);
    const LOG_TABLE=new Uint8Array(256);
    (function(){
        let x=1;
        for(let i=0;i<255;i++){
            EXP_TABLE[i]=x;
            LOG_TABLE[x]=i;
            x<<=1;
            if(x&256)x^=285;
        }
        EXP_TABLE[255]=EXP_TABLE[0];
    })();
    
    function gfMul(a,b){
        return a&&b?EXP_TABLE[(LOG_TABLE[a]+LOG_TABLE[b])%255]:0;
    }
    
    // Reed-Solomonエンコード
    function rsEncode(data,ecLen){
        const poly=rsGenPoly(ecLen);
        const buffer=new Uint8Array(data.length+ecLen);
        buffer.set(data);
        for(let i=0;i<data.length;i++){
            const coef=buffer[i];
            if(coef){
                for(let j=0;j<poly.length;j++){
                    buffer[i+j]^=gfMul(poly[j],coef);
                }
            }
        }
        return buffer.slice(data.length);
    }
    
    function rsGenPoly(n){
        let poly=new Uint8Array([1]);
        for(let i=0;i<n;i++){
            const newPoly=new Uint8Array(poly.length+1);
            for(let j=0;j<poly.length;j++){
                newPoly[j]^=poly[j];
                newPoly[j+1]^=gfMul(poly[j],EXP_TABLE[i]);
            }
            poly=newPoly;
        }
        return poly;
    }
    
    // QRコードバージョン情報
    const VERSION_INFO=[
        null,
        [26,1,1,7,10,13,17],
        [44,1,1,10,16,22,28],
        [70,1,1,15,26,36,44],
        [100,2,1,20,36,52,64],
        [134,2,1,26,48,72,88]
    ];
    
    function getVersion(len,ecLevel){
        for(let v=1;v<=5;v++){
            const cap=VERSION_INFO[v][1+ecLevel];
            if(len<=cap*8)return v;
        }
        return 5;
    }
    
    function createMatrix(version){
        const size=17+version*4;
        return Array(size).fill().map(()=>Array(size).fill(null));
    }
    
    function setFinderPattern(matrix,x,y){
        for(let dy=-1;dy<=7;dy++){
            for(let dx=-1;dx<=7;dx++){
                const px=x+dx,py=y+dy;
                if(px<0||py<0||px>=matrix.length||py>=matrix.length)continue;
                if(dx===-1||dx===7||dy===-1||dy===7){
                    matrix[py][px]=0;
                }else if(dx===0||dx===6||dy===0||dy===6){
                    matrix[py][px]=1;
                }else if(dx>=2&&dx<=4&&dy>=2&&dy<=4){
                    matrix[py][px]=1;
                }else{
                    matrix[py][px]=0;
                }
            }
        }
    }
    
    function setTimingPattern(matrix){
        const size=matrix.length;
        for(let i=8;i<size-8;i++){
            const v=i%2===0?1:0;
            if(matrix[6][i]===null)matrix[6][i]=v;
            if(matrix[i][6]===null)matrix[i][6]=v;
        }
    }
    
    function setFormatInfo(matrix,ecLevel,mask){
        const size=matrix.length;
        const data=(ecLevel<<3)|mask;
        let bits=data;
        for(let i=0;i<10;i++)if(bits&(1<<(9-i)))bits^=0x537<<(9-i);
        bits=(data<<10)|bits;
        bits^=0x5412;
        
        for(let i=0;i<6;i++)matrix[8][i]=(bits>>(14-i))&1;
        matrix[8][7]=(bits>>8)&1;
        matrix[8][8]=(bits>>7)&1;
        matrix[7][8]=(bits>>6)&1;
        for(let i=0;i<6;i++)matrix[5-i][8]=(bits>>i)&1;
        
        for(let i=0;i<8;i++)matrix[size-1-i][8]=(bits>>(14-i))&1;
        for(let i=0;i<7;i++)matrix[8][size-7+i]=(bits>>(6-i))&1;
        matrix[size-8][8]=1;
    }
    
    function encodeData(text,version,ecLevel){
        const data=[];
        data.push(MODE_BYTE);
        data.push(text.length);
        for(let i=0;i<text.length;i++){
            data.push(text.charCodeAt(i));
        }
        
        const ecInfo=VERSION_INFO[version];
        const totalBytes=ecInfo[0];
        const ecBytes=ecInfo[3+ecLevel];
        const dataBytes=totalBytes-ecBytes;
        
        while(data.length<dataBytes){
            data.push(data.length%2===0?PAD0:PAD1);
        }
        
        const dataArr=new Uint8Array(data.slice(0,dataBytes));
        const ec=rsEncode(dataArr,ecBytes);
        return new Uint8Array([...dataArr,...ec]);
    }
    
    function placeData(matrix,data){
        const size=matrix.length;
        let bitIdx=0;
        let up=true;
        
        for(let col=size-1;col>=0;col-=2){
            if(col===6)col--;
            for(let i=0;i<size;i++){
                const row=up?size-1-i:i;
                for(let c=0;c<2;c++){
                    const x=col-c;
                    if(matrix[row][x]===null){
                        const byteIdx=Math.floor(bitIdx/8);
                        const bitPos=7-(bitIdx%8);
                        matrix[row][x]=byteIdx<data.length?((data[byteIdx]>>bitPos)&1):0;
                        bitIdx++;
                    }
                }
            }
            up=!up;
        }
    }
    
    function applyMask(matrix,mask){
        const size=matrix.length;
        const masks=[
            (r,c)=>(r+c)%2===0,
            (r,c)=>r%2===0,
            (r,c)=>c%3===0,
            (r,c)=>(r+c)%3===0,
            (r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,
            (r,c)=>(r*c)%2+(r*c)%3===0,
            (r,c)=>((r*c)%2+(r*c)%3)%2===0,
            (r,c)=>((r+c)%2+(r*c)%3)%2===0
        ];
        const fn=masks[mask];
        for(let r=0;r<size;r++){
            for(let c=0;c<size;c++){
                if(matrix[r][c]!==null&&matrix[r][c]!==2){
                    if(fn(r,c))matrix[r][c]^=1;
                }
            }
        }
    }
    
    return{
        generate:function(text,options){
            const canvas=document.getElementById('qrcode');
            const ctx=canvas.getContext('2d');
            const size=options.size||200;
            const ecLevel=EC_LEVEL[options.level||'M'];
            const fgColor=options.fgColor||'#000';
            const bgColor=options.bgColor||'#fff';
            
            const version=getVersion(text.length,ecLevel);
            const matrix=createMatrix(version);
            const qrSize=matrix.length;
            
            setFinderPattern(matrix,0,0);
            setFinderPattern(matrix,qrSize-7,0);
            setFinderPattern(matrix,0,qrSize-7);
            setTimingPattern(matrix);
            
            const data=encodeData(text,version,ecLevel);
            placeData(matrix,data);
            applyMask(matrix,0);
            setFormatInfo(matrix,ecLevel,0);
            
            canvas.width=size;
            canvas.height=size;
            const moduleSize=size/qrSize;
            
            ctx.fillStyle=bgColor;
            ctx.fillRect(0,0,size,size);
            ctx.fillStyle=fgColor;
            
            for(let y=0;y<qrSize;y++){
                for(let x=0;x<qrSize;x++){
                    if(matrix[y][x]===1){
                        ctx.fillRect(x*moduleSize,y*moduleSize,moduleSize+0.5,moduleSize+0.5);
                    }
                }
            }
        }
    };
})();

let currentTab='text';
let history=JSON.parse(localStorage.getItem('qrHistory')||'[]');

function getContent(){
    switch(currentTab){
        case'text':return document.getElementById('textInput').value;
        case'url':return document.getElementById('urlInput').value;
        case'wifi':
            const ssid=document.getElementById('wifiSsid').value;
            const pass=document.getElementById('wifiPass').value;
            const enc=document.getElementById('wifiEnc').value;
            return`WIFI:T:${enc};S:${ssid};P:${pass};;`;
        case'vcard':
            const name=document.getElementById('vcardName').value;
            const tel=document.getElementById('vcardTel').value;
            const email=document.getElementById('vcardEmail').value;
            const org=document.getElementById('vcardOrg').value;
            return`BEGIN:VCARD\nVERSION:3.0\nN:${name}\nTEL:${tel}\nEMAIL:${email}\nORG:${org}\nEND:VCARD`;
        default:return'';
    }
}

function generateQR(){
    const content=getContent();
    if(!content)return;
    
    QRCode.generate(content,{
        size:+document.getElementById('qrSize').value,
        level:document.getElementById('qrLevel').value,
        fgColor:document.getElementById('fgColor').value,
        bgColor:document.getElementById('bgColor').value
    });
}

function downloadQR(format){
    const canvas=document.getElementById('qrcode');
    const content=getContent();
    
    if(format==='png'){
        const link=document.createElement('a');
        link.download='qrcode.png';
        link.href=canvas.toDataURL('image/png');
        link.click();
    }else{
        // SVG変換（簡易）
        const ctx=canvas.getContext('2d');
        const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
        let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
        svg+=`<rect width="100%" height="100%" fill="${document.getElementById('bgColor').value}"/>`;
        // 簡易SVG変換
        const fg=document.getElementById('fgColor').value;
        for(let y=0;y<canvas.height;y++){
            for(let x=0;x<canvas.width;x++){
                const idx=(y*canvas.width+x)*4;
                if(imageData.data[idx]<128){
                    svg+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${fg}"/>`;
                }
            }
        }
        svg+='</svg>';
        const blob=new Blob([svg],{type:'image/svg+xml'});
        const link=document.createElement('a');
        link.download='qrcode.svg';
        link.href=URL.createObjectURL(blob);
        link.click();
    }
    
    addToHistory(content);
}

function copyQR(){
    const canvas=document.getElementById('qrcode');
    canvas.toBlob(blob=>{
        navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
        showToast();
    });
}

function addToHistory(content){
    const canvas=document.getElementById('qrcode');
    const dataUrl=canvas.toDataURL('image/png');
    history.unshift({content:content.substring(0,30),dataUrl,date:Date.now()});
    if(history.length>12)history.pop();
    localStorage.setItem('qrHistory',JSON.stringify(history));
    renderHistory();
}

function renderHistory(){
    document.getElementById('historyList').innerHTML=history.map((h,i)=>`
        <div class="history-item" onclick="loadHistory(${i})">
            <img src="${h.dataUrl}" alt="QR">
            <p>${h.content}</p>
        </div>
    `).join('');
}

window.loadHistory=function(i){
    // 履歴から復元
    alert('履歴機能: '+history[i].content);
};

function showToast(){
    const toast=document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2000);
}

// タブ切り替え
document.querySelectorAll('.tabs button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.tabs .active').classList.remove('active');
        document.querySelector('.tab-content.active').classList.remove('active');
        this.classList.add('active');
        document.getElementById(this.dataset.tab).classList.add('active');
        currentTab=this.dataset.tab;
        generateQR();
    };
});

// 入力変更時に再生成
document.querySelectorAll('input,textarea,select').forEach(el=>{
    el.addEventListener('input',generateQR);
    el.addEventListener('change',generateQR);
});

generateQR();
renderHistory();
