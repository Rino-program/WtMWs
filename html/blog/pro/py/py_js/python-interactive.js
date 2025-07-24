// Python紹介ブログ用JavaScript

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeInteractiveElements();
    addFadeInAnimations();
});

// フェードインアニメーションの追加
function addFadeInAnimations() {
    const sections = document.querySelectorAll('.content-section, .feature-card, .use-case-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1
    });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// インタラクティブ要素の初期化
function initializeInteractiveElements() {
    // コード実行デモボタンのイベントリスナー
    const demoButtons = document.querySelectorAll('.demo-button');
    demoButtons.forEach(button => {
        button.addEventListener('click', handleDemoClick);
    });
    
    // 用途別カードのクリックイベント
    const useCaseCards = document.querySelectorAll('.use-case-card');
    useCaseCards.forEach(card => {
        card.addEventListener('click', handleUseCaseClick);
    });
}

// デモボタンクリック処理
function handleDemoClick(event) {
    const button = event.target;
    const demoType = button.getAttribute('data-demo');
    const outputElement = button.parentElement.querySelector('.demo-output');
    
    // ローディング表示
    outputElement.innerHTML = '実行中...';
    outputElement.style.color = '#ffd43b';
    
    // 少し遅延を入れてリアルな感じを演出
    setTimeout(() => {
        switch(demoType) {
            case 'hello':
                runHelloWorldDemo(outputElement);
                break;
            case 'calculator':
                runCalculatorDemo(outputElement);
                break;
            case 'list':
                runListDemo(outputElement);
                break;
            case 'function':
                runFunctionDemo(outputElement);
                break;
            default:
                outputElement.innerHTML = 'デモが見つかりませんでした。';
        }
        outputElement.style.color = '#f8f8f2';
    }, 500);
}

// Hello Worldデモ
function runHelloWorldDemo(outputElement) {
    const messages = [
        {
            code: 'print("Hello, World!")',
            result: 'Hello, World!'
        },
        {
            code: 'print("こんにちは、世界！")',
            result: 'こんにちは、世界！'
        },
        {
            code: 'name = "Python"\nprint(f"Welcome to {name}!")',
            result: 'Welcome to Python!'
        }
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    outputElement.innerHTML = `<div style="color: #50fa7b; margin-bottom: 8px;"># コード:</div><div style="color: #f8f8f2; margin-bottom: 10px; font-family: monospace;">${randomMessage.code.replace(/\n/g, '<br>')}</div><div style="color: #ffd43b;">出力: ${randomMessage.result}</div>`;
}

// 計算機デモ
function runCalculatorDemo(outputElement) {
    const calculations = [
        { code: '# 基本的な計算\nresult = 2 + 3\nprint(result)', expr: '2 + 3', result: 5 },
        { code: '# 掛け算\nresult = 10 * 7\nprint(result)', expr: '10 * 7', result: 70 },
        { code: '# 割り算\nresult = 15 / 3\nprint(result)', expr: '15 / 3', result: 5.0 },
        { code: '# べき乗\nresult = 2 ** 8\nprint(result)', expr: '2 ** 8', result: 256 },
        { code: '# 四捨五入\nimport math\nresult = round(3.14159, 2)\nprint(result)', expr: 'round(3.14159, 2)', result: 3.14 }
    ];
    const randomCalc = calculations[Math.floor(Math.random() * calculations.length)];
    outputElement.innerHTML = `<div style="color: #50fa7b; margin-bottom: 8px;"># コード:</div><div style="color: #f8f8f2; margin-bottom: 10px; font-family: monospace;">${randomCalc.code.replace(/\n/g, '<br>')}</div><div style="color: #ffd43b;">出力: ${randomCalc.result}</div>`;
}

// リストデモ
function runListDemo(outputElement) {
    const examples = [
        {
            code: '# リストの作成\nfruits = ["りんご", "バナナ", "オレンジ"]\nprint(fruits)',
            result: '["りんご", "バナナ", "オレンジ"]'
        },
        {
            code: '# リストの合計\nnumbers = [1, 2, 3, 4, 5]\nprint(f"合計: {sum(numbers)}")',
            result: '合計: 15'
        },
        {
            code: '# リストの長さ\ncolors = ["赤", "青", "緑"]\nprint(f"色の数: {len(colors)}")',
            result: '色の数: 3'
        },
        {
            code: '# リストに要素を追加\nanimals = ["犬", "猫"]\nanimals.append("鳥")\nprint(animals)',
            result: '["犬", "猫", "鳥"]'
        }
    ];
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    outputElement.innerHTML = `<div style="color: #50fa7b; margin-bottom: 8px;"># コード:</div><div style="color: #f8f8f2; margin-bottom: 10px; font-family: monospace;">${randomExample.code.replace(/\n/g, '<br>')}</div><div style="color: #ffd43b;">出力: ${randomExample.result}</div>`;
}

// 関数デモ
function runFunctionDemo(outputElement) {
    const functions = [
        {
            code: '# 挨拶関数\ndef greet(name):\n    return f"こんにちは、{name}さん！"\n\nresult = greet("太郎")\nprint(result)',
            result: 'こんにちは、太郎さん！'
        },
        {
            code: '# 二乗を計算する関数\ndef square(x):\n    return x * x\n\nresult = square(5)\nprint(result)',
            result: '25'
        },
        {
            code: '# 偶数かどうか判定\ndef is_even(n):\n    return n % 2 == 0\n\nresult = is_even(8)\nprint(result)',
            result: 'True'
        },
        {
            code: '# 温度変換関数\ndef celsius_to_fahrenheit(c):\n    return c * 9/5 + 32\n\nresult = celsius_to_fahrenheit(25)\nprint(f"{result}°F")',
            result: '77.0°F'
        }
    ];
    const randomFunc = functions[Math.floor(Math.random() * functions.length)];
    outputElement.innerHTML = `<div style="color: #50fa7b; margin-bottom: 8px;"># コード:</div><div style="color: #f8f8f2; margin-bottom: 10px; font-family: monospace;">${randomFunc.code.replace(/\n/g, '<br>')}</div><div style="color: #ffd43b;">出力: ${randomFunc.result}</div>`;
}

// 用途別カードクリック処理
function handleUseCaseClick(event) {
    const card = event.currentTarget;
    const useCase = card.getAttribute('data-use-case');
    
    // 一時的に強調表示
    card.style.transform = 'scale(1.05)';
    card.style.boxShadow = '0 8px 25px rgba(55, 118, 171, 0.4)';
    
    setTimeout(() => {
        card.style.transform = '';
        card.style.boxShadow = '';
    }, 200);
    
    // 詳細情報を表示
    showUseCaseDetails(useCase, card);
}

// 用途詳細情報表示
function showUseCaseDetails(useCase, cardElement) {
    const details = {
        'web': {
            title: 'Web開発',
            description: 'Django、Flask、FastAPIなどのフレームワークを使って、強力なWebアプリケーションを構築できます。',
            examples: ['Instagram（Django）', 'Pinterest（Django）', 'Spotify（Django）']
        },
        'data': {
            title: 'データ分析',
            description: 'pandas、NumPy、matplotlibを使ってデータの処理・分析・可視化が簡単にできます。',
            examples: ['売上データ分析', '株価予測', '顧客行動分析']
        },
        'ai': {
            title: 'AI・機械学習',
            description: 'TensorFlow、PyTorch、scikit-learnで最先端のAIモデルを開発できます。',
            examples: ['画像認識', '自然言語処理', '推薦システム']
        },
        'automation': {
            title: '自動化・スクリプト',
            description: '繰り返し作業を自動化し、効率を大幅に向上させることができます。',
            examples: ['ファイル整理', 'メール送信', 'データ収集']
        },
        'game': {
            title: 'ゲーム開発',
            description: 'Pygameライブラリを使って2Dゲームを作成できます。',
            examples: ['パズルゲーム', 'アクションゲーム', '教育ゲーム']
        },
        'science': {
            title: '科学計算',
            description: 'SciPy、SymPyを使って複雑な科学計算や数学的問題を解決できます。',
            examples: ['物理シミュレーション', '統計解析', '数値計算']
        }
    };
    
    const detail = details[useCase];
    if (detail) {
        // 既存の詳細表示があれば削除
        const existingDetail = document.querySelector('.use-case-detail');
        if (existingDetail) {
            existingDetail.remove();
        }
        
        // 新しい詳細表示を作成
        const detailElement = document.createElement('div');
        detailElement.className = 'use-case-detail';
        detailElement.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 5px solid #3776ab;">
                <h4 style="color: #3776ab; margin-top: 0;">${detail.title}</h4>
                <p>${detail.description}</p>
                <strong>実例:</strong>
                <ul style="margin: 10px 0;">
                    ${detail.examples.map(example => `<li>${example}</li>`).join('')}
                </ul>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; float: right;">閉じる</button>
            </div>
        `;
        
        cardElement.parentElement.insertBefore(detailElement, cardElement.nextSibling);
        
        // スムーズスクロール
        detailElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// コード比較のハイライト機能
function highlightCodeDifferences() {
    const codeBlocks = document.querySelectorAll('.code-block');
    
    codeBlocks.forEach(block => {
        let html = block.innerHTML;
        
        // キーワードのハイライト
        html = html.replace(/\b(def|if|else|for|while|import|from|class|return|try|except|with|as)\b/g, 
            '<span class="keyword">$1</span>');
        
        // 文字列のハイライト
        html = html.replace(/(["'].*?["'])/g, '<span class="string">$1</span>');
        
        // コメントのハイライト
        html = html.replace(/(#.*$)/gm, '<span class="comment">$1</span>');
        
        // 関数名のハイライト
        html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="function">$1</span>');
        
        // 数字のハイライト
        html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
        
        block.innerHTML = html;
    });
}

// ページ読み込み完了後にコードハイライトを実行
window.addEventListener('load', function() {
    highlightCodeDifferences();
});

// スムーズスクロール機能（ナビゲーション用）
function smoothScrollTo(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 学習進度トラッカー（簡易版）
let learningProgress = {
    basics: false,
    syntax: false,
    examples: false,
    comparison: false
};

function updateLearningProgress(section) {
    learningProgress[section] = true;
    
    // 進度表示の更新
    const progressBar = document.querySelector('.learning-progress-bar');
    if (progressBar) {
        const completedSections = Object.values(learningProgress).filter(Boolean).length;
        const totalSections = Object.keys(learningProgress).length;
        const percentage = (completedSections / totalSections) * 100;
        
        progressBar.style.width = `${percentage}%`;
    }
}

// セクション読了検知
function trackSectionReading() {
    const sections = document.querySelectorAll('.content-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
                const sectionId = entry.target.id;
                if (sectionId && learningProgress.hasOwnProperty(sectionId)) {
                    updateLearningProgress(sectionId);
                }
            }
        });
    }, {
        threshold: 0.7
    });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}
