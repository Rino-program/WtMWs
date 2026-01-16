function calculate() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    
    if (!height || !weight || height <= 0 || weight <= 0) return;
    
    // BMI計算
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    // 表示
    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    
    // カテゴリ判定
    const categoryEl = document.getElementById('bmi-category');
    let category, categoryClass, tip;
    
    if (bmi < 18.5) {
        category = '低体重';
        categoryClass = 'category-underweight';
        tip = '体重が軽めです。バランスの良い食事で適正体重を目指しましょう。';
    } else if (bmi < 25) {
        category = '普通体重';
        categoryClass = 'category-normal';
        tip = '適正な体重です！このまま健康的な生活を続けましょう。';
    } else if (bmi < 30) {
        category = '肥満（1度）';
        categoryClass = 'category-overweight';
        tip = '少し体重が多めです。食事と運動のバランスを見直してみましょう。';
    } else {
        category = '肥満（2度以上）';
        categoryClass = 'category-obese';
        tip = '健康のため、生活習慣の改善を検討してください。専門家への相談もおすすめです。';
    }
    
    categoryEl.textContent = category;
    categoryEl.className = `bmi-category ${categoryClass}`;
    
    // ポインタ位置
    let pointerPos = ((bmi - 15) / 25) * 100;
    pointerPos = Math.max(0, Math.min(100, pointerPos));
    document.getElementById('bmi-pointer').style.left = `${pointerPos}%`;
    
    // 各種体重計算
    const idealWeight = 22 * heightM * heightM;
    const minWeight = 18.5 * heightM * heightM;
    const maxWeight = 25 * heightM * heightM;
    const weightDiff = weight - idealWeight;
    
    document.getElementById('ideal-weight').textContent = idealWeight.toFixed(1) + ' kg';
    document.getElementById('min-weight').textContent = minWeight.toFixed(1) + ' kg';
    document.getElementById('max-weight').textContent = maxWeight.toFixed(1) + ' kg';
    
    const diffText = weightDiff >= 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1);
    document.getElementById('weight-diff').textContent = diffText + ' kg';
    
    // アドバイス
    document.getElementById('tips').innerHTML = `<strong>💡 アドバイス:</strong> ${tip}`;
}

// イベントリスナー
document.getElementById('height').addEventListener('input', calculate);
document.getElementById('weight').addEventListener('input', calculate);

// 初期計算
calculate();
