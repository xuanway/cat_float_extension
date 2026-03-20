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

    // 预加载语音列表，便于优先选择日语女声
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

        // 播放鼓励语音（日语二次元女生风格）
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

    // 优先选择日语女声；如果不可用则回退到日语语音
    function pickJapaneseFemaleVoice() {
        if (!window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        const japaneseVoices = voices.filter(v => /^ja([-_]|$)/i.test(v.lang));
        if (!japaneseVoices.length) return null;

        const femaleHints = /(female|woman|girl|jp|japan|kyoko|nanami|haruka|sakura|sayaka|mei|yui|microsoft ayumi|google 日本語)/i;
        return japaneseVoices.find(v => femaleHints.test(v.name)) || japaneseVoices[0];
    }

    function playCheerVoice() {
        if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return;

        const utterance = new SpeechSynthesisUtterance('がんばって、君ならできるよ。');
        utterance.lang = 'ja-JP';
        utterance.rate = 1.08;
        utterance.pitch = 1.32;
        utterance.volume = 1;

        const voice = pickJapaneseFemaleVoice();
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