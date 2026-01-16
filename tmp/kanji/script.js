const kanjiData={
    n5:[
        {kanji:'日',reading:'にち/ひ',meaning:'day, sun',examples:['日曜日','今日','日本']},
        {kanji:'月',reading:'げつ/つき',meaning:'month, moon',examples:['月曜日','一月','月']},
        {kanji:'火',reading:'か/ひ',meaning:'fire',examples:['火曜日','火事','花火']},
        {kanji:'水',reading:'すい/みず',meaning:'water',examples:['水曜日','水泳','水']},
        {kanji:'木',reading:'もく/き',meaning:'tree, wood',examples:['木曜日','木','植木']},
        {kanji:'金',reading:'きん/かね',meaning:'gold, money',examples:['金曜日','お金','金魚']},
        {kanji:'土',reading:'ど/つち',meaning:'earth, soil',examples:['土曜日','土','土地']},
        {kanji:'山',reading:'さん/やま',meaning:'mountain',examples:['富士山','山','山田']},
        {kanji:'川',reading:'かわ/がわ',meaning:'river',examples:['川','河川','小川']},
        {kanji:'田',reading:'た/でん',meaning:'rice field',examples:['田んぼ','田中','水田']},
        {kanji:'人',reading:'じん/ひと',meaning:'person',examples:['人','日本人','人間']},
        {kanji:'口',reading:'こう/くち',meaning:'mouth',examples:['入口','口','人口']},
        {kanji:'目',reading:'め/もく',meaning:'eye',examples:['目','目的','科目']},
        {kanji:'耳',reading:'じ/みみ',meaning:'ear',examples:['耳','耳鼻科']},
        {kanji:'手',reading:'て/しゅ',meaning:'hand',examples:['手','手紙','選手']},
        {kanji:'足',reading:'あし/そく',meaning:'foot, leg',examples:['足','足りる','満足']},
        {kanji:'大',reading:'だい/おお',meaning:'big, large',examples:['大きい','大学','大人']},
        {kanji:'小',reading:'しょう/ちい',meaning:'small, little',examples:['小さい','小学校','小説']},
        {kanji:'上',reading:'じょう/うえ',meaning:'up, above',examples:['上','上手','以上']},
        {kanji:'下',reading:'か/した',meaning:'down, below',examples:['下','下手','地下']},
    ],
    n4:[
        {kanji:'食',reading:'しょく/た',meaning:'eat, food',examples:['食べる','食事','食堂']},
        {kanji:'飲',reading:'いん/の',meaning:'drink',examples:['飲む','飲料','飲食']},
        {kanji:'見',reading:'けん/み',meaning:'see, look',examples:['見る','意見','見学']},
        {kanji:'聞',reading:'ぶん/き',meaning:'hear, ask',examples:['聞く','新聞','聞こえる']},
        {kanji:'読',reading:'どく/よ',meaning:'read',examples:['読む','読書','読者']},
        {kanji:'書',reading:'しょ/か',meaning:'write',examples:['書く','図書館','書類']},
        {kanji:'話',reading:'わ/はな',meaning:'speak, talk',examples:['話す','電話','会話']},
        {kanji:'買',reading:'ばい/か',meaning:'buy',examples:['買う','売買','買い物']},
        {kanji:'売',reading:'ばい/う',meaning:'sell',examples:['売る','販売','売店']},
        {kanji:'学',reading:'がく/まな',meaning:'learn, study',examples:['学ぶ','学校','学生']},
    ],
    n3:[
        {kanji:'経',reading:'けい/へ',meaning:'pass through',examples:['経験','経済','経由']},
        {kanji:'済',reading:'さい/す',meaning:'finish, economy',examples:['経済','返済','済む']},
        {kanji:'政',reading:'せい/まつり',meaning:'politics',examples:['政治','政府','行政']},
        {kanji:'治',reading:'じ/ち/おさ',meaning:'govern, cure',examples:['政治','治療','治る']},
        {kanji:'法',reading:'ほう',meaning:'law, method',examples:['方法','法律','文法']},
        {kanji:'律',reading:'りつ',meaning:'law, rule',examples:['法律','規律','旋律']},
        {kanji:'権',reading:'けん/ごん',meaning:'right, power',examples:['権利','人権','政権']},
        {kanji:'利',reading:'り',meaning:'profit, benefit',examples:['権利','利用','便利']},
    ]
};

let mode='reading',questions=[],currentQ=0,score=0,streak=0,totalAnswered=0,correctAnswered=0;

document.querySelectorAll('.modes button').forEach(btn=>{
    btn.onclick=function(){
        document.querySelector('.modes .active').classList.remove('active');
        this.classList.add('active');
        mode=this.dataset.mode;
        startQuiz();
    };
});

function startQuiz(){
    const allKanji=[...kanjiData.n5,...kanjiData.n4,...kanjiData.n3];
    questions=shuffleArray(allKanji).slice(0,10);
    currentQ=0;
    score=0;
    streak=0;
    updateStats();
    showQuestion();
}

function shuffleArray(arr){
    const result=[...arr];
    for(let i=result.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
}

function showQuestion(){
    const q=questions[currentQ];
    document.getElementById('progress').innerHTML=questions.map((_,i)=>
        `<div class="progress-dot${i<currentQ?(questions[i].userCorrect?' correct':' wrong'):''}${i===currentQ?' current':''}"></div>`
    ).join('');
    
    document.getElementById('result').classList.remove('show');
    document.getElementById('nextBtn').classList.add('hidden');
    
    if(mode==='reading'){
        document.getElementById('kanjiDisplay').textContent=q.kanji;
        document.getElementById('hint').textContent='この漢字の読み方は？';
        generateChoices(q.reading,getWrongReadings(q));
    }else if(mode==='meaning'){
        document.getElementById('kanjiDisplay').textContent=q.kanji;
        document.getElementById('hint').textContent='この漢字の意味は？';
        generateChoices(q.meaning,getWrongMeanings(q));
    }else{
        document.getElementById('kanjiDisplay').textContent=q.reading.split('/')[0];
        document.getElementById('hint').textContent='この読み方の漢字は？';
        generateChoices(q.kanji,getWrongKanji(q));
    }
}

function getWrongReadings(correct){
    const allKanji=[...kanjiData.n5,...kanjiData.n4,...kanjiData.n3];
    return shuffleArray(allKanji.filter(k=>k.kanji!==correct.kanji)).slice(0,3).map(k=>k.reading);
}

function getWrongMeanings(correct){
    const allKanji=[...kanjiData.n5,...kanjiData.n4,...kanjiData.n3];
    return shuffleArray(allKanji.filter(k=>k.kanji!==correct.kanji)).slice(0,3).map(k=>k.meaning);
}

function getWrongKanji(correct){
    const allKanji=[...kanjiData.n5,...kanjiData.n4,...kanjiData.n3];
    return shuffleArray(allKanji.filter(k=>k.kanji!==correct.kanji)).slice(0,3).map(k=>k.kanji);
}

function generateChoices(correct,wrongs){
    const choices=shuffleArray([correct,...wrongs]);
    document.getElementById('choices').innerHTML=choices.map(c=>
        `<div class="choice" onclick="selectAnswer(this,'${c}','${correct}')">${c}</div>`
    ).join('');
}

function selectAnswer(el,selected,correct){
    if(document.querySelector('.choice.correct'))return;
    
    totalAnswered++;
    const isCorrect=selected===correct;
    
    document.querySelectorAll('.choice').forEach(c=>{
        c.classList.remove('selected');
        if(c.textContent===correct)c.classList.add('correct');
        else if(c===el&&!isCorrect)c.classList.add('wrong');
    });
    
    questions[currentQ].userCorrect=isCorrect;
    
    const result=document.getElementById('result');
    result.classList.add('show');
    result.className='result show '+(isCorrect?'correct-result':'wrong-result');
    document.getElementById('resultIcon').textContent=isCorrect?'✓':'✗';
    document.getElementById('resultText').textContent=isCorrect?'正解！':'不正解...';
    
    const q=questions[currentQ];
    document.getElementById('explanation').innerHTML=`
        <strong>${q.kanji}</strong> (${q.reading})<br>
        意味: ${q.meaning}<br>
        例: ${q.examples.join(', ')}
    `;
    
    if(isCorrect){
        score+=10+streak*2;
        streak++;
        correctAnswered++;
    }else{
        streak=0;
    }
    updateStats();
    
    document.getElementById('nextBtn').classList.remove('hidden');
}

function nextQuestion(){
    currentQ++;
    if(currentQ>=questions.length){
        showFinalResult();
    }else{
        showQuestion();
    }
}

function showFinalResult(){
    const accuracy=Math.round(correctAnswered/questions.length*100);
    document.getElementById('quizContainer').innerHTML=`
        <div class="final-result">
            <h2>🎉 クイズ終了!</h2>
            <div class="final-score">${score}点</div>
            <div class="final-message">
                正解: ${correctAnswered}/${questions.length} (${accuracy}%)<br>
                最長連続正解: ${Math.max(...questions.reduce((acc,q,i)=>{
                    if(q.userCorrect){acc[acc.length-1]++;}else{acc.push(0);}
                    return acc;
                },[0]))}問
            </div>
            <button class="btn" onclick="startQuiz()">もう一度</button>
        </div>
    `;
}

function updateStats(){
    document.getElementById('score').textContent=score;
    document.getElementById('streak').textContent=streak;
    document.getElementById('accuracy').textContent=totalAnswered?Math.round(correctAnswered/totalAnswered*100)+'%':'-%';
}

startQuiz();
