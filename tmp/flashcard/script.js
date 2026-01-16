let decks=JSON.parse(localStorage.getItem('flashcardDecks')||'[]');
let currentDeck=null,editingDeckId=null,studyCards=[],currentCardIdx=0,correctCount=0;
let tempCards=[];

document.querySelectorAll('.tab').forEach(tab=>{
    tab.onclick=function(){
        document.querySelector('.tab.active').classList.remove('active');
        this.classList.add('active');
        const view=this.dataset.view;
        document.getElementById('decksView').classList.toggle('hidden',view!=='decks');
        document.getElementById('studyView').classList.toggle('hidden',view!=='study');
    };
});

function renderDecks(){
    const list=document.getElementById('deckList');
    if(!decks.length){
        list.innerHTML='<div class="empty-state">デッキがありません<br>新しいデッキを作成しましょう</div>';
        return;
    }
    list.innerHTML=decks.map(d=>`
        <div class="deck-item" onclick="startStudy('${d.id}')">
            <div class="deck-info">
                <h3>${d.name}</h3>
                <span>${d.cards.length}枚のカード${d.desc?' • '+d.desc:''}</span>
            </div>
            <div class="deck-actions">
                <button class="deck-btn" onclick="event.stopPropagation();editDeck('${d.id}')">✏️</button>
                <button class="deck-btn" onclick="event.stopPropagation();deleteDeck('${d.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function openDeckModal(deckId=null){
    editingDeckId=deckId;
    tempCards=[];
    if(deckId){
        const deck=decks.find(d=>d.id===deckId);
        document.getElementById('deckModalTitle').textContent='デッキを編集';
        document.getElementById('deckName').value=deck.name;
        document.getElementById('deckDesc').value=deck.desc||'';
        tempCards=[...deck.cards];
        document.getElementById('cardSection').classList.remove('hidden');
        renderCardList();
    }else{
        document.getElementById('deckModalTitle').textContent='新しいデッキ';
        document.getElementById('deckName').value='';
        document.getElementById('deckDesc').value='';
        document.getElementById('cardSection').classList.add('hidden');
    }
    document.getElementById('deckModal').classList.add('active');
}

function closeDeckModal(){
    document.getElementById('deckModal').classList.remove('active');
    editingDeckId=null;
}

function saveDeck(){
    const name=document.getElementById('deckName').value.trim();
    if(!name)return alert('デッキ名を入力してください');
    
    if(editingDeckId){
        const deck=decks.find(d=>d.id===editingDeckId);
        deck.name=name;
        deck.desc=document.getElementById('deckDesc').value.trim();
        deck.cards=tempCards;
    }else{
        decks.push({
            id:Date.now().toString(),
            name,
            desc:document.getElementById('deckDesc').value.trim(),
            cards:[]
        });
    }
    localStorage.setItem('flashcardDecks',JSON.stringify(decks));
    closeDeckModal();
    renderDecks();
}

function editDeck(id){
    openDeckModal(id);
}

function deleteDeck(id){
    if(!confirm('このデッキを削除しますか？'))return;
    decks=decks.filter(d=>d.id!==id);
    localStorage.setItem('flashcardDecks',JSON.stringify(decks));
    renderDecks();
}

function openCardModal(){
    document.getElementById('cardFrontInput').value='';
    document.getElementById('cardBackInput').value='';
    document.getElementById('cardModal').classList.add('active');
}

function closeCardModal(){
    document.getElementById('cardModal').classList.remove('active');
}

function addCard(){
    const front=document.getElementById('cardFrontInput').value.trim();
    const back=document.getElementById('cardBackInput').value.trim();
    if(!front||!back)return alert('表面と裏面を入力してください');
    tempCards.push({id:Date.now().toString(),front,back});
    renderCardList();
    closeCardModal();
}

function renderCardList(){
    document.getElementById('cardList').innerHTML=tempCards.map(c=>`
        <div class="card-item">
            <div class="card-item-content">
                <div class="card-item-front">${c.front}</div>
                <div class="card-item-back">${c.back}</div>
            </div>
            <button class="deck-btn" onclick="removeCard('${c.id}')">×</button>
        </div>
    `).join('')||'<div style="color:#666;text-align:center;padding:20px">カードがありません</div>';
}

function removeCard(id){
    tempCards=tempCards.filter(c=>c.id!==id);
    renderCardList();
}

function startStudy(deckId){
    currentDeck=decks.find(d=>d.id===deckId);
    if(!currentDeck.cards.length){
        alert('このデッキにはカードがありません。カードを追加してください。');
        editDeck(deckId);
        return;
    }
    studyCards=shuffleArray([...currentDeck.cards]);
    currentCardIdx=0;
    correctCount=0;
    document.querySelector('[data-view="study"]').click();
    showCard();
}

function shuffleArray(arr){
    for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
}

function showCard(){
    const card=studyCards[currentCardIdx];
    document.getElementById('cardFront').textContent=card.front;
    document.getElementById('cardBack').textContent=card.back;
    document.getElementById('flashcard').classList.remove('flipped');
    updateStudyUI();
}

function flipCard(){
    document.getElementById('flashcard').classList.toggle('flipped');
}

function answerCard(correct){
    if(correct)correctCount++;
    currentCardIdx++;
    if(currentCardIdx>=studyCards.length){
        finishStudy();
    }else{
        showCard();
    }
}

function updateStudyUI(){
    document.getElementById('studyProgress').textContent=`${currentCardIdx+1}/${studyCards.length} カード`;
    document.getElementById('progressFill').style.width=((currentCardIdx+1)/studyCards.length*100)+'%';
    const accuracy=currentCardIdx>0?Math.round(correctCount/currentCardIdx*100):0;
    document.getElementById('studyScore').textContent=`正解率: ${accuracy}%`;
}

function finishStudy(){
    const accuracy=Math.round(correctCount/studyCards.length*100);
    alert(`学習完了！\n\n正解: ${correctCount}/${studyCards.length}\n正解率: ${accuracy}%`);
    document.querySelector('[data-view="decks"]').click();
}

renderDecks();
