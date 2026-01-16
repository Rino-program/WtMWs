const quotes=[
    {text:'千里の道も一歩から',author:'老子',cat:'wisdom'},
    {text:'失敗は成功の母である',author:'トーマス・エジソン',cat:'success'},
    {text:'人生で大切なのは、勝つことではなく、努力することである',author:'ピエール・ド・クーベルタン',cat:'life'},
    {text:'愛とは、大きな愛情をもって小さなことをすることです',author:'マザー・テレサ',cat:'love'},
    {text:'未来を予測する最良の方法は、それを創造することだ',author:'エイブラハム・リンカーン',cat:'motivation'},
    {text:'継続は力なり',author:'格言',cat:'motivation'},
    {text:'人を愛することは、その人を愛する理由がなくなっても愛し続けることである',author:'ヴィクトル・ユーゴー',cat:'love'},
    {text:'知識は力である',author:'フランシス・ベーコン',cat:'wisdom'},
    {text:'機会は準備された心にのみ訪れる',author:'ルイ・パスツール',cat:'success'},
    {text:'人生とは自転車のようなものだ。倒れないためには走り続けなければならない',author:'アルベルト・アインシュタイン',cat:'life'},
    {text:'夢見ることができれば、それは実現できる',author:'ウォルト・ディズニー',cat:'motivation'},
    {text:'笑顔は最も短い距離で二人を結ぶ',author:'ヴィクトル・ボルジェ',cat:'humor'},
    {text:'成功とは、熱意を失わずに失敗から失敗へと進む能力である',author:'ウィンストン・チャーチル',cat:'success'},
    {text:'今日という日は、残りの人生の最初の日である',author:'チャールズ・ディードリッヒ',cat:'life'},
    {text:'行動は言葉よりも雄弁である',author:'格言',cat:'wisdom'},
    {text:'幸福とは香水のようなものだ。人に振りかけると自分にもかかる',author:'ラルフ・ワルド・エマーソン',cat:'life'},
    {text:'想像力は知識より重要である',author:'アルベルト・アインシュタイン',cat:'wisdom'},
    {text:'成功の秘訣は、目的を持って努力することである',author:'ベンジャミン・ディズレーリ',cat:'success'},
    {text:'困難の中にこそ機会がある',author:'アルベルト・アインシュタイン',cat:'motivation'},
    {text:'人生は短い。だから友よ、空騒ぎに時を費やすな',author:'シェイクスピア',cat:'life'}
];

let currentQuote=null;
let currentCategory='all';
let favorites=JSON.parse(localStorage.getItem('favoriteQuotes')||'[]');

const categoryNames={all:'すべて',life:'人生',success:'成功',love:'愛',wisdom:'知恵',motivation:'モチベーション',humor:'ユーモア'};

function getFilteredQuotes(){
    if(currentCategory==='all')return quotes;
    return quotes.filter(q=>q.cat===currentCategory);
}

function newQuote(){
    const filtered=getFilteredQuotes();
    const randomIndex=Math.floor(Math.random()*filtered.length);
    currentQuote=filtered[randomIndex];
    displayQuote(currentQuote);
}

function displayQuote(quote){
    const card=document.getElementById('quoteCard');
    card.style.opacity='0';
    card.style.transform='translateY(20px)';
    
    setTimeout(()=>{
        document.getElementById('quoteText').textContent=`「${quote.text}」`;
        document.getElementById('quoteAuthor').textContent=quote.author;
        document.getElementById('categoryBadge').textContent=categoryNames[quote.cat];
        updateFavButton();
        card.style.opacity='1';
        card.style.transform='translateY(0)';
    },200);
}

function toggleFavorite(){
    if(!currentQuote)return;
    const index=favorites.findIndex(f=>f.text===currentQuote.text);
    if(index===-1){
        favorites.push(currentQuote);
    }else{
        favorites.splice(index,1);
    }
    localStorage.setItem('favoriteQuotes',JSON.stringify(favorites));
    updateFavButton();
    renderFavorites();
}

function updateFavButton(){
    if(!currentQuote)return;
    const isFav=favorites.some(f=>f.text===currentQuote.text);
    document.getElementById('favBtn').innerHTML=isFav?'💖 お気に入り済み':'❤️ お気に入り';
}

function removeFavorite(index){
    favorites.splice(index,1);
    localStorage.setItem('favoriteQuotes',JSON.stringify(favorites));
    updateFavButton();
    renderFavorites();
}

function renderFavorites(){
    document.getElementById('favCount').textContent=favorites.length+'件';
    document.getElementById('favoritesList').innerHTML=favorites.map((f,i)=>`
        <div class="fav-item" onclick="displayQuote(favorites[${i}]);currentQuote=favorites[${i}]">
            <div class="quote">「${f.text}」</div>
            <div class="author">— ${f.author}</div>
            <button class="remove" onclick="event.stopPropagation();removeFavorite(${i})">×</button>
        </div>
    `).join('');
}

function copyQuote(){
    if(!currentQuote)return;
    const text=`「${currentQuote.text}」 — ${currentQuote.author}`;
    navigator.clipboard.writeText(text);
    showToast();
}

function shareQuote(){
    if(!currentQuote)return;
    document.getElementById('sharePreview').innerHTML=`「${currentQuote.text}」<br><br>— ${currentQuote.author}`;
    document.getElementById('shareModal').classList.add('show');
}

function closeShare(){
    document.getElementById('shareModal').classList.remove('show');
}

function shareTwitter(){
    const text=encodeURIComponent(`「${currentQuote.text}」 — ${currentQuote.author}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`,'_blank');
    closeShare();
}

function shareLine(){
    const text=encodeURIComponent(`「${currentQuote.text}」 — ${currentQuote.author}`);
    window.open(`https://social-plugins.line.me/lineit/share?text=${text}`,'_blank');
    closeShare();
}

function showToast(){
    const toast=document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2000);
}

document.querySelectorAll('.categories button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.categories .active').classList.remove('active');
        this.classList.add('active');
        currentCategory=this.dataset.cat;
        newQuote();
    };
});

document.getElementById('shareModal').onclick=function(e){
    if(e.target===this)closeShare();
};

// 初期化
newQuote();
renderFavorites();

// 今日の名言（日付ベースで固定）
const today=new Date().toDateString();
const dailyIndex=today.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%quotes.length;
currentQuote=quotes[dailyIndex];
displayQuote(currentQuote);
