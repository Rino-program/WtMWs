// DOM Elements
const imageInput = document.getElementById('image-input');
const fileName = document.getElementById('file-name');
const widthSlider = document.getElementById('width-slider');
const widthValue = document.getElementById('width-value');
const densitySlider = document.getElementById('density-slider');
const densityValue = document.getElementById('density-value');
const monoBtn = document.getElementById('mono-btn');
const colorBtn = document.getElementById('color-btn');
const canvas = document.getElementById('preview-canvas');
const asciiOutput = document.getElementById('ascii-output');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const toast = document.getElementById('toast');

// State
let currentImage = null;
let isColorMode = true;

// ASCII character sets by density
const charSets = {
    1: '@#%*+=-:. ',
    2: '@%#*+=-:. ',
    3: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
    4: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. '
};

const densityLabels = {
    1: '簡易',
    2: '標準',
    3: '詳細',
    4: '最詳細'
};

// Initialize
asciiOutput.classList.add('placeholder');

// Event Listeners
imageInput.addEventListener('change', handleImageUpload);
widthSlider.addEventListener('input', handleWidthChange);
densitySlider.addEventListener('input', handleDensityChange);
monoBtn.addEventListener('click', () => setColorMode(false));
colorBtn.addEventListener('click', () => setColorMode(true));
copyBtn.addEventListener('click', copyToClipboard);
downloadBtn.addEventListener('click', downloadAscii);

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    fileName.textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            generateAscii();
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleWidthChange() {
    widthValue.textContent = widthSlider.value;
    if (currentImage) {
        generateAscii();
    }
}

function handleDensityChange() {
    const level = parseInt(densitySlider.value);
    densityValue.textContent = densityLabels[level];
    if (currentImage) {
        generateAscii();
    }
}

function setColorMode(isColor) {
    isColorMode = isColor;
    
    if (isColor) {
        colorBtn.classList.add('active');
        monoBtn.classList.remove('active');
    } else {
        monoBtn.classList.add('active');
        colorBtn.classList.remove('active');
    }
    
    if (currentImage) {
        generateAscii();
    }
}

function generateAscii() {
    if (!currentImage) return;
    
    const width = parseInt(widthSlider.value);
    const density = parseInt(densitySlider.value);
    const chars = charSets[density];
    
    // Calculate dimensions
    const aspectRatio = currentImage.height / currentImage.width;
    const charAspect = 0.5; // Characters are taller than wide
    const height = Math.round(width * aspectRatio * charAspect);
    
    // Set canvas size and draw image
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(currentImage, 0, 0, width, height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    
    // Clear output
    asciiOutput.classList.remove('placeholder');
    asciiOutput.innerHTML = '';
    
    if (isColorMode) {
        // Color mode - use spans
        let html = '';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const charIndex = Math.floor((1 - brightness) * (chars.length - 1));
                const char = chars[charIndex] || ' ';
                
                html += `<span style="color:rgb(${r},${g},${b})">${char === ' ' ? '&nbsp;' : escapeHtml(char)}</span>`;
            }
            html += '\n';
        }
        asciiOutput.innerHTML = html;
    } else {
        // Monochrome mode - plain text
        let text = '';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const charIndex = Math.floor((1 - brightness) * (chars.length - 1));
                const char = chars[charIndex] || ' ';
                
                text += char;
            }
            text += '\n';
        }
        asciiOutput.textContent = text;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard() {
    let text;
    
    if (isColorMode) {
        // Extract text from spans
        text = asciiOutput.innerText;
    } else {
        text = asciiOutput.textContent;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('コピーしました！');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('コピーに失敗しました');
    });
}

function downloadAscii() {
    let text;
    
    if (isColorMode) {
        text = asciiOutput.innerText;
    } else {
        text = asciiOutput.textContent;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('ダウンロードしました！');
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Drag and drop support
const uploadSection = document.querySelector('.upload-section');

uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = '#00d9ff';
    uploadSection.style.background = 'rgba(0, 217, 255, 0.1)';
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.style.borderColor = '';
    uploadSection.style.background = '';
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = '';
    uploadSection.style.background = '';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        imageInput.files = e.dataTransfer.files;
        handleImageUpload({ target: imageInput });
    }
});
