const WORDS = {
    latin: ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde', 'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta'],
    hipster: ['artisan', 'aesthetic', 'organic', 'sustainable', 'craft', 'vintage', 'authentic', 'curated', 'bespoke', 'handcrafted', 'locally-sourced', 'farm-to-table', 'slow-food', 'kombucha', 'avocado', 'toast', 'cold-brew', 'pour-over', 'specialty', 'third-wave', 'single-origin', 'fair-trade', 'minimalist', 'hygge', 'wabi-sabi', 'mindful', 'intentional', 'wellness', 'self-care', 'plant-based', 'vegan', 'gluten-free', 'activated', 'charcoal', 'turmeric', 'matcha', 'acai', 'quinoa', 'kale', 'superfood'],
    japanese: ['桜', '富士山', '茶道', '書道', '華道', '俳句', '和', '禅', '侘び寂び', '花鳥風月', '四季', '風情', '情緒', '趣', '雅', '美意識', '繊細', '調和', '自然', '伝統', '文化', '芸術', '職人', '匠', '技', '心', '魂', '精神', '誠', '真', '善', '美', '清浄', '静寂', '平和', '幸福', '感謝', '思いやり', 'おもてなし', '絆'],
    tech: ['algorithm', 'API', 'bandwidth', 'blockchain', 'cloud', 'data', 'encryption', 'framework', 'gateway', 'hash', 'infrastructure', 'JavaScript', 'kernel', 'latency', 'microservice', 'node', 'optimization', 'protocol', 'query', 'runtime', 'scalability', 'throughput', 'UI/UX', 'virtualization', 'webhook', 'XML', 'yield', 'zero-day', 'agile', 'DevOps', 'CI/CD', 'container', 'kubernetes', 'machine-learning', 'neural-network', 'serverless', 'GraphQL', 'TypeScript', 'React', 'Vue']
};

const HEADINGS = {
    latin: ['De Finibus', 'Ad Infinitum', 'Carpe Diem', 'Veni Vidi Vici', 'Ex Nihilo'],
    hipster: ['The Craft Journey', 'Authentic Experience', 'Mindful Living', 'Curated Moments', 'Sustainable Future'],
    japanese: ['序章', '第一章', '第二章', '結び', '考察'],
    tech: ['Overview', 'Architecture', 'Implementation', 'Performance', 'Conclusion']
};

let generatedText = '';
let generatedHtml = '';

function getRandomWord(style) {
    const words = WORDS[style];
    return words[Math.floor(Math.random() * words.length)];
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSentence(style, startWithLorem = false) {
    const length = Math.floor(Math.random() * 10) + 5;
    let words = [];
    
    if (startWithLorem && style === 'latin') {
        words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
        for (let i = 5; i < length; i++) {
            words.push(getRandomWord(style));
        }
    } else {
        for (let i = 0; i < length; i++) {
            words.push(getRandomWord(style));
        }
        words[0] = capitalize(words[0]);
    }
    
    return words.join(style === 'japanese' ? '' : ' ') + (style === 'japanese' ? '。' : '.');
}

function generateParagraph(style, startWithLorem = false) {
    const sentenceCount = Math.floor(Math.random() * 4) + 3;
    let sentences = [];
    
    for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence(style, i === 0 && startWithLorem));
    }
    
    return sentences.join(' ');
}

function generate() {
    const type = document.getElementById('type').value;
    const count = parseInt(document.getElementById('count').value);
    const style = document.getElementById('style').value;
    const startLorem = document.getElementById('startLorem').checked;
    const addHeadings = document.getElementById('addHeadings').checked;
    
    let result = [];
    let htmlResult = [];
    
    switch (type) {
        case 'paragraphs':
            for (let i = 0; i < count; i++) {
                const para = generateParagraph(style, i === 0 && startLorem);
                if (addHeadings && i % 3 === 0) {
                    const heading = HEADINGS[style][Math.floor(Math.random() * HEADINGS[style].length)];
                    result.push('\n' + heading + '\n');
                    htmlResult.push(`<h2>${heading}</h2>`);
                }
                result.push(para);
                htmlResult.push(`<p>${para}</p>`);
            }
            break;
            
        case 'sentences':
            for (let i = 0; i < count; i++) {
                result.push(generateSentence(style, i === 0 && startLorem));
            }
            htmlResult = result.map(s => `<p>${s}</p>`);
            break;
            
        case 'words':
            let words = [];
            if (startLorem && style === 'latin') {
                words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
            }
            while (words.length < count) {
                words.push(getRandomWord(style));
            }
            result = [words.slice(0, count).join(style === 'japanese' ? '' : ' ')];
            htmlResult = [`<p>${result[0]}</p>`];
            break;
            
        case 'lists':
            const items = [];
            for (let i = 0; i < count; i++) {
                const item = generateSentence(style, false).slice(0, -1); // Remove period
                items.push(item);
            }
            result = items.map((item, i) => `${i + 1}. ${item}`);
            htmlResult = ['<ol>', ...items.map(item => `<li>${item}</li>`), '</ol>'];
            break;
    }
    
    generatedText = result.join('\n\n');
    generatedHtml = htmlResult.join('\n');
    
    const output = document.getElementById('output');
    output.innerHTML = generatedHtml;
    
    // Update stats
    const wordCount = generatedText.split(/\s+/).filter(w => w).length;
    const charCount = generatedText.length;
    document.getElementById('stats').textContent = `${wordCount}語 / ${charCount}文字`;
}

function setPreset(count, type) {
    document.getElementById('count').value = count;
    document.getElementById('type').value = type;
    generate();
}

function copyText() {
    if (!generatedText) {
        showToast('先にテキストを生成してください');
        return;
    }
    navigator.clipboard.writeText(generatedText).then(() => {
        showToast('テキストをコピーしました！');
    });
}

function copyHtml() {
    if (!generatedHtml) {
        showToast('先にテキストを生成してください');
        return;
    }
    navigator.clipboard.writeText(generatedHtml).then(() => {
        showToast('HTMLをコピーしました！');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Initial generation
generate();
