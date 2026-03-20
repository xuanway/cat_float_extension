// 防重复注入：避免页面刷新/iframe里多次生成猫咪
if (!window.hasInitedGlobalCat) {
    window.hasInitedGlobalCat = true;

    // 1. 创建猫咪的DOM结构
    const catContainer = document.createElement('div');
    catContainer.id = 'global-cat-float-window';
    catContainer.innerHTML = `
        <div class="global-cat-box" id="global-cat-body">
            <div class="global-cat-ear global-ear-left"></div>
            <div class="global-cat-ear global-ear-right"></div>
            <div class="global-cat-face">
                <div class="global-cat-eye global-eye-left"></div>
                <div class="global-cat-eye global-eye-right"></div>
                <div class="global-cat-nose"></div>
                <div class="global-cat-mouth"></div>
                <div class="global-cat-blush global-blush-left"></div>
                <div class="global-cat-blush global-blush-right"></div>
            </div>
            <div class="global-cat-tail"></div>
            <div class="global-heart-container" id="global-heart-box"></div>
        </div>
    `;
    // 把猫咪添加到页面中
    document.body.appendChild(catContainer);

    // 2. 获取核心元素
    const catWindow = document.getElementById('global-cat-float-window');
    const catBody = document.getElementById('global-cat-body');
    const heartBox = document.getElementById('global-heart-box');
    const eyes = document.querySelectorAll('.global-cat-eye');

    // 预加载语音列表，便于优先选择英语女声
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', () => {
        window.speechSynthesis.getVoices();
    });

    // 3. 拖动逻辑（带屏幕边界限制，不会拖出屏幕）
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // 鼠标按下：开始拖动
    catWindow.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = catWindow.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        catWindow.style.transition = 'none';
        e.stopPropagation();
        e.preventDefault();
    });

    // 鼠标移动：拖动中
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // 计算新位置
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        // 边界限制：不让猫咪拖出屏幕外
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const catWidth = catWindow.offsetWidth;
        const catHeight = catWindow.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, winWidth - catWidth));
        newTop = Math.max(0, Math.min(newTop, winHeight - catHeight));

        // 更新位置
        catWindow.style.left = newLeft + 'px';
        catWindow.style.top = newTop + 'px';
        catWindow.style.right = 'auto';
        catWindow.style.bottom = 'auto';
    });

    // 鼠标松开/离开页面：结束拖动
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            catWindow.style.transition = 'transform 0.1s ease-out';
        }
    });
    document.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    // 4. 自动随机眨眼（2-5秒随机眨眼，更自然）
    function autoBlink() {
        eyes.forEach(eye => eye.classList.add('blink'));
        setTimeout(() => {
            eyes.forEach(eye => eye.classList.remove('blink'));
        }, 100);
        // 随机下一次眨眼时间
        const nextBlinkTime = Math.random() * 3000 + 2000;
        setTimeout(autoBlink, nextBlinkTime);
    }
    autoBlink();

    // 5. 点击摸头互动
    catBody.addEventListener('click', (e) => {
        if (isDragging) return; // 拖动时不触发互动
        e.stopPropagation();
        e.preventDefault();

        // 触发摸头动画
        catBody.classList.add('touch');
        setTimeout(() => {
            catBody.classList.remove('touch');
        }, 600);

        // 生成爱心特效
        createHeart();

        // 播放鼓励语音（英语二次元少女风格，每五次换一句）
        playCheerVoice();
    });

    // 生成爱心函数
    function createHeart() {
        const heart = document.createElement('div');
        heart.className = 'global-heart';
        heartBox.appendChild(heart);
        // 动画结束后移除元素，避免DOM堆积
        setTimeout(() => heart.remove(), 1200);
    }

    // 鼓励语池 —— 读取 phrases.js 中的 365 句语录
    // 如需自定义语句，请直接编辑 phrases.js，无需改动此文件
    const CHEER_PHRASES = window.CAT_CHEER_PHRASES || ["You can do it! Keep going~!"];

    // 点击计数器：每点击 5 次推进到下一句（跨页面刷新用 sessionStorage 保持）
    let clickCount = parseInt(sessionStorage.getItem('catClickCount') || '0', 10);
    let phraseIndex = parseInt(sessionStorage.getItem('catPhraseIndex') || '0', 10);

    function getNextPhrase() {
        clickCount += 1;
        sessionStorage.setItem('catClickCount', clickCount);
        // 每满 5 次切换到下一句
        if (clickCount % 5 === 0) {
            phraseIndex = (phraseIndex + 1) % CHEER_PHRASES.length;
            sessionStorage.setItem('catPhraseIndex', phraseIndex);
        }
        return CHEER_PHRASES[phraseIndex];
    }

    // 优先选择英语女声（二次元少女风）
    function pickEnglishFemaleVoice() {
        if (!window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        const enVoices = voices.filter(v => /^en([-_]|$)/i.test(v.lang));
        if (!enVoices.length) return null;

        // 按优先级匹配女声关键词
        const femaleHints = /zira|samantha|google\s+uk\s+english\s+female|google\s+us\s+english(?!\s+male)|aria|jenny|sonia|susan|hazel|moira|tessa|fiona|allison|ava|veena|karen|female|woman|girl/i;
        return enVoices.find(v => femaleHints.test(v.name)) || enVoices[0];
    }

    function playCheerVoice() {
        if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return;

        const utterance = new SpeechSynthesisUtterance(getNextPhrase());
        utterance.lang = 'en-US';
        utterance.rate = 1.0;    // 正常语速
        utterance.pitch = 1.45;  // 偏高音调，接近二次元女声
        utterance.volume = 1;

        const voice = pickEnglishFemaleVoice();
        if (voice) utterance.voice = voice;

        // 避免快速连点导致语音堆叠
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // 6. 移动端触摸兼容（手机端可拖动、可点击）
    catWindow.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        const rect = catWindow.getBoundingClientRect();
        isDragging = false;
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
    });

    catWindow.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        const touch = e.touches[0];
        
        let newLeft = touch.clientX - offsetX;
        let newTop = touch.clientY - offsetY;

        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const catWidth = catWindow.offsetWidth;
        const catHeight = catWindow.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, winWidth - catWidth));
        newTop = Math.max(0, Math.min(newTop, winHeight - catHeight));

        catWindow.style.left = newLeft + 'px';
        catWindow.style.top = newTop + 'px';
        catWindow.style.right = 'auto';
        catWindow.style.bottom = 'auto';
    });

    catWindow.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 非拖动状态才触发摸头互动
        if (!isDragging) {
            catBody.classList.add('touch');
            setTimeout(() => catBody.classList.remove('touch'), 600);
            createHeart();
            playCheerVoice();
        }
        isDragging = false;
    });
}