document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // 1. ОПТИМИЗАЦИЯ СКРОЛЛА (без querySelector на каждый пиксель)
    const header = document.querySelector('.header-wrapper');
    if (header) {
        let isScrolled = false;
        window.addEventListener('scroll', () => {
            const shouldScroll = window.scrollY > 20;
            if (shouldScroll !== isScrolled) {
                isScrolled = shouldScroll;
                header.classList.toggle('scrolled', isScrolled);
                header.style.background = shouldScroll ? 'rgba(8,9,12,0.97)' : 'rgba(10,11,15,0.88)';
            }
        }, { passive: true });
    }

    // 2. ОТЛОЖЕННАЯ ЗАГРУЗКА TELEGRAM-ВИДЖЕТА (Intersection Observer)
    const tgFeed = document.getElementById('tg-feed');
    if (tgFeed) {
        const observer = new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                initTelegramWidget(tgFeed);
                obs.disconnect(); 
            }
        }, { rootMargin: '300px' });
        observer.observe(tgFeed);
    }

    function initTelegramWidget(container) {
        container.innerHTML = '';
        const wrap = document.createElement('div');
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-post', 'markirovka57/2');
        script.setAttribute('data-width', '100%');
        script.setAttribute('data-dark', '1');
        script.setAttribute('data-color', '229ED9');
        script.setAttribute('data-userpic', 'false');
        
        script.onerror = () => renderFallbackTG(container);
        wrap.appendChild(script);
        container.appendChild(wrap);

        // Fallback если виджет не прогрузился из-за блокировок
        setTimeout(() => {
            if (!container.querySelector('iframe')) renderFallbackTG(container);
        }, 5000);
    }

    function renderFallbackTG(container) {
        const REAL_POSTS = [
            { text: 'На первом фото — самостоятельная работа с ЧЗ нашего клиента, на втором наша работа. Хотите так же? У нас для вас специальные условия 👇', date: 'сегодня', img: null, url: 'https://t.me/markirovka57' },
            { text: 'Как думаете, ваш конкурент может воспользоваться ситуацией и отправить сообщение о нарушении? Мы знаем как защититься от этого — читайте в канале.', date: 'вчера', img: null, url: 'https://t.me/markirovka57' },
            { text: '‼️ Штрафы за отсутствие маркировки выросли. Не рискуйте — оформите КИЗы до начала продаж. Маркировка одежды, обуви, текстиля под ключ от 23 290 ₽/мес.', date: '2 дня назад', img: null, url: 'https://t.me/markirovka57' },
            { text: '📦 Белый импорт через Казахстан — законный способ ввезти товары без согласия правообладателя. Помогаем с маркировкой и выводом на WB/Ozon.', date: '3 дня назад', img: null, url: 'https://t.me/markirovka57' },
            { text: '✅ Наш клиент: ТУФЛИ Женская арт. М373. Материал верха: Текстиль, подкладки: Кожзам. Марка: Roza Bella. Товар успешно введён в оборот. Всё совпало!', date: '4 дня назад', img: null, url: 'https://t.me/markirovka57' }
        ];
        container.innerHTML = REAL_POSTS.map(p => `
            <a class="tg-post" href="${p.url}" target="_blank">
                ${p.img ? `<img class="tg-post-img" src="${p.img}" loading="lazy">` : ''}
                <div class="tg-post-text">${p.text}</div>
                <div class="tg-post-meta">
                    <span class="tg-post-date">${p.date}</span>
                    <span class="tg-post-open">Читать в TG →</span>
                </div>
            </a>
        `).join('');
    }

    // 3. ОПТИМИЗАЦИЯ НОВОСТЕЙ
    const POOL = [
      {s:'cz', d:'2026-05-15', t:'Маркировка товаров: актуальные требования Честного ЗНАКа', x:'', u:'https://честныйзнак.рф/info/'},
      {s:'cz', d:'2026-05-07', t:'Новости и изменения в системе маркировки — официальный раздел', x:'', u:'https://честныйзнак.рф/info/'},
      {s:'cz', d:'2026-05-02', t:'Честный ЗНАК: новости для участников оборота товаров', x:'', u:'https://честныйзнак.рф/info/'},
      {s:'teksher', d:'2026-05-13', t:'Текшер KG — система маркировки товаров Кыргызстана', x:'', u:'https://main.teksher.kg/'},
      {s:'teksher', d:'2026-05-08', t:'Актуальные новости и обновления Текшер KG', x:'', u:'https://main.teksher.kg/'}
    ];
    const SOURCE_META = {
      cz:      {label:'Честный ЗНАК', cls:'ns-cz',      url:'https://честныйзнак.рф/info/'},
      teksher: {label:'Текшер KG',    cls:'ns-teksher', url:'https://main.teksher.kg/'}
    };
    let allNewsItems = [];
    let currentTab = 'all';

    function fmtDate(s){
      if(!s) return '';
      try{
        const d = new Date(s);
        return isNaN(d) ? '' : d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
      }catch(e){return '';}
    }

    function renderNews(){
      const box = document.getElementById('news-container');
      if(!box) return;
      const items = currentTab === 'all' ? allNewsItems.slice(0,6) : allNewsItems.filter(i => i.source === currentTab).slice(0,4);
      if(!items.length){
        box.innerHTML='<div class="news-loader" style="grid-column:1/-1">Нет данных.</div>';
        return;
      }
      box.innerHTML = items.map(it => {
        const sm = SOURCE_META[it.source] || {label:it.source, cls:'', url:'#'};
        return `<a href="${it.link}" target="_blank" rel="noopener" class="news-card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px;">
            <span class="news-source-badge ${it.badgeClass||sm.cls}">${it.badgeLabel||sm.label}</span>
            <span class="nc-date">${fmtDate(it.date)}</span>
          </div>
          <h4 class="nc-title">${it.title}</h4>
          <span class="nc-read">Читать →</span>
        </a>`;
      }).join('');
    }

    window.showNewsTab = function(tab){
      currentTab = tab;
      document.querySelectorAll('.news-tab-btn').forEach(b => b.classList.remove('active-ntab'));
      const btn = document.getElementById('ntab-'+tab);
      if(btn) btn.classList.add('active-ntab');
      renderNews();
    };

    function loadCurated(){
      allNewsItems = POOL.map(p => {
        const sm = SOURCE_META[p.s];
        return {source:p.s, title:p.t, desc:p.x, date:p.d, link:p.u, badgeClass:sm.cls, badgeLabel:sm.label, isStatic:true};
      });
      allNewsItems.sort((a,b) => new Date(b.date) - new Date(a.date));
      renderNews();
    }

    window.loadAllNews = function(){
      const box = document.getElementById('news-container');
      if(box) box.innerHTML='<div class="news-loader" style="grid-column:1/-1">⏳ Обновление...</div>';
      loadCurated();
    };
    loadCurated();

    // 4. SCROLL REVEAL
    function reveal() {
      const reveals = document.querySelectorAll(".reveal");
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
          reveals[i].classList.add("active");
        }
      }
    }
    window.addEventListener("scroll", reveal);
    reveal();

    // 5. TG SCROLL POPUP
    let tgPopupTriggered = false;
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 80 && !tgPopupTriggered) {
        const popup = document.getElementById('tgScrollPopup');
        if(popup) popup.classList.add('show');
        tgPopupTriggered = true;
      }
    }, { passive: true });

    window.closeTgScroll = function() {
      const popup = document.getElementById('tgScrollPopup');
      if(popup) popup.classList.remove('show');
    };

    // 6. BURGER MENU
    const burgerBtn = document.querySelector('.burger-btn');
    const navLinks = document.querySelector('.nav-links');
    if (burgerBtn && navLinks) {
      burgerBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        burgerBtn.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
      });
      document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('active');
          burgerBtn.innerHTML = '☰';
        });
      });
      
      // Inject mobile language switcher and CTA
      const mobileBottom = document.createElement('li');
      mobileBottom.style.cssText = 'padding:12px 24px 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
      mobileBottom.innerHTML = `
        <button onclick="setLang('ru')" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;">RU</button>
        <button onclick="setLang('en')" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;">EN</button>
        <button onclick="setLang('kg')" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;">KG</button>
        <a href="tel:+79933717770" style="color:rgba(255,255,255,0.6);font-size:14px;font-weight:600;text-decoration:none;margin-left:4px;">+7 993 371 7770</a>
      `;
      navLinks.appendChild(mobileBottom);
      
      const mobileCtaLi = document.createElement('li');
      mobileCtaLi.style.cssText = 'padding:8px 24px 4px;';
      mobileCtaLi.innerHTML = `<button onclick="openModal();document.querySelector('.nav-links').classList.remove('active');document.querySelector('.burger-btn').innerHTML='☰';" style="width:100%;background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;font-weight:800;font-size:15px;padding:13px;border-radius:12px;border:none;cursor:pointer;">Оставить заявку</button>`;
      navLinks.appendChild(mobileCtaLi);
    }

    // 7. МОДАЛЬНОЕ ОКНО
    window.openModal = function() { const m = document.getElementById('contactModal'); if(m) m.classList.add('active'); }
    window.closeModal = function() { const m = document.getElementById('contactModal'); if(m) m.classList.remove('active'); }
    const modalEl = document.getElementById('contactModal');
    if(modalEl) {
        modalEl.addEventListener('click', e => { if(e.target === modalEl) closeModal(); });
    }

    // 8. КАТЕГОРИИ
    window.czTab = function(key, btn) {
        document.querySelectorAll('.cat-cz-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.cat-cz-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById('czp-' + key);
        if(pane) pane.classList.add('active');
    };

    window.switchCategory = function(paneId, btn) {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.cat-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(paneId);
        if(pane) pane.classList.add('active');
    };

    // 9. ЧАТ-БОТ
    let isCbOpen = false;
    let cbInited = false;
    window.cbToggle = function(){
      const w = document.getElementById('chatbot-window');
      const b = document.getElementById('cb-badge');
      isCbOpen = !isCbOpen;
      if(w) w.style.display = isCbOpen ? 'flex' : 'none';
      if(isCbOpen){ 
        if(w) w.style.flexDirection = 'column'; 
        if(b) b.style.display = 'none'; 
        if(!cbInited){ cbInit(); cbInited = true; } 
      }
    };

    const cbAnswers = {
      price:   {label:'💰 Стоимость',    text:'Тарифы от <b>23 290 ₽/мес</b>. КИЗы включены в стоимость. Пополнение кабинета Честного ЗНАКА — 0,61 ₽/КИЗ. <a href="#pricing" onclick="cbToggle()" style="color:var(--cz-yellow)">Смотреть тарифы ↗</a>'},
      start:   {label:'🚀 Как начать',   text:'<b>1)</b> Оставьте заявку → <b>2)</b> Регистрируем кабинет Честного ЗНАКА → <b>3)</b> Описываем карточки → <b>4)</b> Заказываем КИЗы → <b>5)</b> Вводим товар в оборот. Начало — бесплатная консультация.'},
      kiz:     {label:'📦 Что такое КИЗ',text:'<b>КИЗ</b> — уникальный DataMatrix-код на каждую единицу товара. Без него продажа запрещена. Штраф — до 300 000 ₽, товар могут изъять.'},
      mp:      {label:'🛒 Маркетплейсы', text:'Работаем с <b>Wildberries, Ozon, Яндекс Маркет, Мегамаркет</b> и Золотое Яблоко. Формируем УПД, вводим/выводим из оборота — всё под ключ.'},
      kz:      {label:'🇰🇿 Белый импорт',text:'Оформляем маркировку для <b>белого (параллельного) импорта через Казахстан</b>: одежда, обувь, электроника, мебель, парфюмерия, велосипеды, шины и другие товары по перечню МТИП РК. Помогаем легально ввести на маркетплейсы РФ.'},
      kep:     {label:'🔑 КЭП / ЭДО',   text:'Для работы с Честным ЗНАКОМ нужна <b>КЭП</b> (квалифицированная электронная подпись). Мы помогаем её оформить и настроить ЭДО — всё под ключ.'},
      contact: {label:'📞 Связаться',    text:'Свяжитесь любым способом:<br><a href="https://t.me/+79933717770" target="_blank" style="color:#229ED9;font-weight:700;">✈ Telegram</a> &nbsp; <a href="https://wa.me/79933717770" target="_blank" style="color:#25D366;font-weight:700;">📱 WhatsApp</a> &nbsp; <a href="https://vk.com/markirovkatovarov" target="_blank" style="color:#0077FF;font-weight:700;">💬 ВКонтакте</a><br><a href="https://t.me/markirovka57" target="_blank" style="color:#229ED9;">📢 Наш Telegram-канал</a>'}
    };

    const cbKeywords = {
      'стоимость':'price','цена':'price','тариф':'price','сколько':'price','рубл':'price',
      'начать':'start','как':'start','старт':'start','регистр':'start','первый':'start',
      'киз':'kiz','код':'kiz','datamatrix':'kiz','дата':'kiz','матрик':'kiz',
      'маркетплейс':'mp','wildberries':'mp','ozon':'mp','озон':'mp','вб':'mp','wb':'mp','яндекс':'mp',
      'казахст':'kz','белый':'kz','импорт':'kz','параллельн':'kz','кз':'kz',
      'кэп':'kep','эдо':'kep','подпись':'kep','электронн':'kep',
      'контакт':'contact','связ':'contact','написат':'contact','телефон':'contact','позвон':'contact'
    };

    function cbAddMsg(html, cls){
      const d = document.createElement('div');
      d.className = cls; d.innerHTML = html;
      const box = document.getElementById('cb-msgs');
      if(box) { box.appendChild(d); box.scrollTop = box.scrollHeight; }
    }

    function cbAddChips(){
      const box = document.getElementById('cb-msgs');
      if(!box) return;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
      Object.keys(cbAnswers).forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'bot-chip'; btn.innerHTML = cbAnswers[k].label;
        btn.onclick = () => cbAnswer(k);
        wrap.appendChild(btn);
      });
      box.appendChild(wrap);
      box.scrollTop = box.scrollHeight;
    }

    window.cbAnswer = function(key){
      const a = cbAnswers[key];
      cbAddMsg(a.label, 'user-msg');
      setTimeout(() => {
        cbAddMsg(a.text, 'bot-msg');
        setTimeout(cbAddChips, 300);
      }, 350);
    };

    window.cbSend = function(){
      const inp = document.getElementById('cb-input');
      if(!inp) return;
      const text = inp.value.trim();
      if(!text) return;
      inp.value = '';
      cbAddMsg(text, 'user-msg');
      const lower = text.toLowerCase();
      let matched = null;
      for(const k in cbKeywords) { if(lower.includes(k)) { matched = cbKeywords[k]; break; } }
      setTimeout(() => {
        if(matched){ cbAddMsg(cbAnswers[matched].text, 'bot-msg'); } 
        else { cbAddMsg('Хороший вопрос! Для развёрнутого ответа свяжитесь с нами:<br><a href="https://t.me/+79933717770" target="_blank" style="color:#229ED9;font-weight:700;">✈ Telegram</a> &nbsp; <a href="https://wa.me/79933717770" target="_blank" style="color:#25D366;font-weight:700;">📱 WhatsApp</a>', 'bot-msg'); }
        setTimeout(cbAddChips, 300);
      }, 380);
    };

    function cbInit(){
      cbAddMsg('👋 Привет! Я помогу с вопросами о маркировке товаров. Выберите тему:', 'bot-msg');
      setTimeout(cbAddChips, 200);
    }

    // 10. ЯЗЫКОВЫЕ СЛОВАРИ
    const dict = {
      ru: {
        "nav-cat": "Отрасли", "nav-news": "Новости", "nav-tek": "Текшер", "nav-price": "Тарифы", "nav-req": "Оставить заявку",
        "hero-h1": "Маркировка<br><span>«Честный ЗНАК»</span><br>под ключ",
        "hero-p": "Снимаем рутину с селлеров и импортеров. Правильный ввод в оборот, создание карточек и привязка УПД для отгрузки на маркетплейсы без штрафов.",
        "hero-btn": "Начать работу", "mp-title": "Работаем с маркетплейсами",
        "cat-title": "Категории товаров для <span>маркировки</span>",
        "cat-sub": "Готовые решения «под ключ» для каждой обязательной товарной группы.",
        "proc-title": "Процесс маркировки Честный ЗНАК",
        "proc-1": "Регистрируем личный<br>кабинет в системе<br>«Честный знак»",
        "proc-2": "Описываем карточки<br>каждого товара<br>и проходим модерацию",
        "proc-3": "Заказываем маркировку<br>товара в нужном<br>количестве",
        "proc-4": "Вводим и выводим<br>товар из оборота",
        "proc-5": "Формируем<br>и подписываем УПД",
        "proc-6": "Экономим Ваше время<br>на маркировке товаров",
        "cz-sub": "национальная система<br>цифровой маркировки", "crpt-sub": "Центр развития<br>перспективных<br>технологий", "tek-logo": "ТЕКШЕР",
        "tek-badge": "Первые в РФ", "tek-title": "Надежная интеграция с<br><span>Текшер KG</span>",
        "tek-desc": "Настраиваем ЭДО для бесшовной работы с системой маркировки Кыргызстана. Помогаем легально ввести товар в оборот, чтобы ваша партия прошла таможню и была принята маркетплейсами.",
        "tek-btn": "Подключить интеграцию",
        "pr-title": "Тарифы на услуги маркировки", "pr-desc": "КИЗы включены в тарифы, пополнение личного кабинета <span>0,61₽/КИЗ</span>",
        "pr-1m": "1 месяц", "pr-3m": "3 месяца", "pr-6m": "6 месяцев", "pr-12m": "12 месяцев",
        "pr-select": "Выбрать", "pr-hit": "ХИТ СЕЛЛЕРОВ",
        "pr-sub-3": "20 996₽/мес", "pr-sub-6": "18 665₽/мес", "pr-sub-12": "16 249₽/мес",
        "pr-vip": "ВИП", "pr-vip-sub": "от 100 000 КИЗов", "pr-vip-badge": "ИНДИВИДУАЛЬНЫЙ ПРОЕКТ", "pr-vip-btn": "Написать ВКонтакте",
        "f-title": "Что входит в тариф:",
        "f-1": "Регистрация на сервисах ГС1 и «Честный знак»", "f-2": "Создание карточек товаров в «Честном знаке»", "f-3": "Создание и ввод в оборот кодов маркировки", "f-4": "Передача маркировок на маркетплейсы (УПД)", "f-5": "Вывод продукции из оборота", "f-6": "Выбор шаблона для этикетки",
        "f-ul1": "БЕЗ ЛИМИТА", "f-ul2": "БЕЗ ЛИМИТА", "f-ul3": "БЕЗ ЛИМИТА", "f-ul4": "БЕЗ ЛИМИТА",
        "n-title": "Актуальные <span>новости</span>", "n-sub": "Сводка последних изменений в правилах маркировки.", "n-sync": "Синхронизация с серверами", "n-load": "Загрузка сводок Честного ЗНАКа...",
        "ft-desc": "Профессиональная автоматизация и аутсорсинг процессов цифровой маркировки для селлеров и производителей.",
        "ft-nav": "Навигация", "ft-l1": "Категории товаров", "ft-l2": "Интеграция Текшер", "ft-l3": "Тарифы", "ft-l4": "Новости",
        "ft-cont": "Контакты для связи", "ft-tg": "Telegram сообщество: @markirovka57", "ft-wa": "Написать в WhatsApp",
        "pop-title": "Вступайте к нам в сообщество Селлеров!", "pop-btn": "Перейти в телеграм",
        "m-title": "Свяжитесь с нами", "m-desc": "Выберите удобный мессенджер для связи с нами.",
        "m-btn1": "Написать в Telegram", "m-btn2": "Написать в WhatsApp", "m-btn3": "Написать ВКонтакте",
        "sub-clothes": "Маркировка одежды под ключ", "sub-shoes": "Маркировка обуви под ключ", "sub-bads": "Маркировка БАДов под ключ", "sub-mp": "Для маркетплейсов",
        "faq-title": "Частые <span>вопросы</span>", "faq-sub": "Всё, что нужно знать о маркировке товаров Честный ЗНАК",
        "whatmark-sub": "Полный перечень товарных групп под обязательную маркировку Честный ЗНАК",
        "tp-badge": "🔥 ВАЖНО ДЛЯ СЕЛЛЕРОВ",
        "tp-title": "Продаёшь товары с WB или Ozon?<br><span>Текшер KG — твой ключ к легальному импорту</span>",
        "tp-desc": "Официальная система маркировки Кыргызстана. Ввози товары через ЕАЭС без проблем с Честным ЗНАКом.",
        "tp-cta": "Узнать подробнее",
        "cattab-clothes": "Одежда и обувь", "cattab-food": "Напитки и продукты", "cattab-pharma": "Фармацевтика", "cattab-cosm": "Косметика и бытхим", "cattab-nonprod": "Непрод. товары", "cattab-auto": "Автотовары", "cattab-electro": "Электроника", "cattab-pilot": "Пилотные проекты",
        "faq-q1": "Сколько стоит маркировка товаров под ключ?", "faq-q2": "Какие маркетплейсы поддерживаются?", "faq-q3": "Что такое Честный ЗНАК и обязательна ли маркировка?", "faq-q4": "Работаете ли вы с Кыргызстаном (Текшер KG)?", "faq-q5": "Как быстро можно начать маркировку?", "faq-q6": "Нужна ли ЭЦП (электронная подпись) для работы?",
        "faq-a1": "Стоимость начинается <strong>от 23 290 ₽ в месяц</strong>. КИЗы уже включены в тарифы — вы не платите сверху за каждый код. Пополнение личного кабинета Честного ЗНАКА — 0,61 ₽/КИЗ.",
        "faq-a2": "Работаем с <strong>Wildberries, Ozon, Яндекс Маркет, Мегамаркет</strong> и Золотое Яблоко. Формируем и подписываем УПД.",
        "faq-a3": "Честный ЗНАК — государственная система обязательной маркировки товаров в России. Без маркировки продажа большинства категорий <strong>запрещена</strong>.",
        "faq-a4": "Да! Мы работаем с системой <strong>Текшер KG</strong> — аналога Честного ЗНАКА в Кыргызстане. Настраиваем ЭДО, помогаем ввести товар в оборот.",
        "faq-a5": "Мы берём на себя всё: регистрацию кабинета в Честном ЗНАКЕ, описание карточек товаров, заказ КИЗов и первую отгрузку на маркетплейс.",
        "faq-a6": "Для работы с системой Честный ЗНАК требуется квалифицированная электронная подпись (КЭП). <strong>Мы помогаем её оформить</strong> и настроить.",
        "czc-clothes": "Одежда", "czc-shoes": "Обувь", "czc-bedding": "Постельное бельё", "czc-knitwear": "Трикотаж", "czc-bags": "Сумки и кожизделия", "czc-fur": "Шубы и меховые изделия", "czc-water": "Упакованная вода", "czc-sweets": "Сладости и кондитерка", "czc-petfood": "Корм для животных", "czc-drinks": "Безалкогольные напитки", "czc-meds": "Лекарственные средства", "czc-meddev": "Медицинские изделия", "czc-bads": "БАДы", "czc-vet": "Ветпрепараты", "czc-optics": "Очки и линзы", "czc-antisep": "Антисептики", "czc-perfume": "Парфюмерия", "czc-cosm": "Косметика и уход", "czc-chem": "Бытовая химия", "czc-hygiene": "Гигиенические товары", "czc-soap": "Мыло и моющие средства", "czc-furniture": "Мебель", "czc-kids": "Детские товары", "czc-build": "Стройматериалы", "czc-techtext": "Технический текстиль", "czc-tires": "Шины и покрышки", "czc-autoparts": "Автозапчасти", "czc-bikes": "Велосипеды и самокаты", "czc-phones": "Смартфоны", "czc-laptops": "Ноутбуки и ПК", "czc-photo": "Фото и видео техника", "czc-gaming": "Игровые консоли", "czc-garden": "Товары для садоводства", "czc-sport": "Спортивные товары"
      },
      en: {
        "nav-cat": "Industries", "nav-news": "News", "nav-tek": "Teksher", "nav-price": "Pricing", "nav-req": "Leave a request",
        "hero-h1": "Turnkey<br><span>«Honest ZNAK»</span><br>Labeling",
        "hero-p": "We relieve sellers and importers from routine. Correct market entry, product card creation, and UPD linking for marketplace shipments without fines.",
        "hero-btn": "Get started", "mp-title": "We work with marketplaces",
        "cat-title": "Working with all <span>categories</span>", "cat-sub": "Turnkey solutions for every mandatory product group.",
        "proc-title": "Honest ZNAK Labeling Process",
        "proc-1": "Register a personal<br>account in the<br>«Honest ZNAK» system", "proc-2": "Describe product<br>cards and pass<br>moderation", "proc-3": "Order the required<br>amount of<br>labeling codes", "proc-4": "Enter and withdraw<br>products from<br>circulation", "proc-5": "Generate and sign<br>the UPD", "proc-6": "Save your time<br>on product<br>labeling",
        "cz-sub": "national digital<br>labeling system", "crpt-sub": "Center for Research<br>in Perspective<br>Technologies", "tek-logo": "TEKSHER",
        "tek-badge": "First in the RF", "tek-title": "Reliable integration with<br><span>Teksher KG</span>",
        "tek-desc": "We set up EDI for seamless work with the Kyrgyzstan labeling system. We help legally put products into circulation so your batch passes customs and is accepted by marketplaces.",
        "tek-btn": "Connect integration",
        "pr-title": "Labeling Services Pricing", "pr-desc": "Identification marks included in tariffs, account top-up <span>0.61₽/mark</span>",
        "pr-1m": "1 month", "pr-3m": "3 months", "pr-6m": "6 months", "pr-12m": "12 months",
        "pr-select": "Select", "pr-hit": "BESTSELLER",
        "pr-sub-3": "20 996₽/mo", "pr-sub-6": "18 665₽/mo", "pr-sub-12": "16 249₽/mo",
        "pr-vip": "VIP", "pr-vip-sub": "from 100,000 marks", "pr-vip-badge": "NEGOTIABLE", "pr-vip-btn": "Contact Stanislav",
        "f-title": "What's included in the tariff:",
        "f-1": "Registration in GS1 and «Honest ZNAK»", "f-2": "Creating product cards in «Honest ZNAK»", "f-3": "Creation and activation of labeling codes", "f-4": "Transferring labels to marketplaces (UPD)", "f-5": "Withdrawal of products from circulation", "f-6": "Choosing a template for the label",
        "f-ul1": "UNLIMITED", "f-ul2": "UNLIMITED", "f-ul3": "UNLIMITED", "f-ul4": "UNLIMITED",
        "n-title": "Latest <span>news</span>", "n-sub": "Summary of the latest changes in labeling rules.", "n-sync": "Syncing with servers", "n-load": "Loading Honest ZNAK summaries...",
        "ft-desc": "Professional automation and outsourcing of digital labeling processes for sellers and manufacturers.",
        "ft-nav": "Navigation", "ft-l1": "Product categories", "ft-l2": "Teksher Integration", "ft-l3": "Pricing", "ft-l4": "News",
        "ft-cont": "Contact Details", "ft-tg": "Telegram community: @markirovka57", "ft-wa": "Message on WhatsApp",
        "pop-title": "Join our Sellers community!", "pop-btn": "Go to Telegram",
        "m-title": "Contact us", "m-desc": "Choose a convenient messenger.<br><span style=\"color: #fff; font-weight: 600;\">Specialist will reply in 5 minutes.</span>",
        "m-btn1": "Message (Telegram)", "m-btn2": "Message (WhatsApp)", "m-btn3": "VKontakte",
        "sub-clothes": "Turnkey clothing labeling", "sub-shoes": "Turnkey shoe labeling", "sub-bads": "Turnkey supplements labeling", "sub-mp": "For marketplaces",
        "faq-title": "Frequently Asked Questions", "faq-sub": "Everything you need to know about Honest ZNAK labeling",
        "whatmark-sub": "Full list of mandatory product groups for Honest ZNAK labeling",
        "tp-badge": "🔥 IMPORTANT FOR SELLERS",
        "tp-title": "Selling on Wildberries or Ozon?<br><span>Teksher KG — your key to legal import</span>",
        "tp-desc": "Official labeling system of Kyrgyzstan. Import goods via EAEU without issues with Honest ZNAK.",
        "tp-cta": "Learn more",
        "cattab-clothes": "Clothing & Footwear", "cattab-food": "Beverages & Food", "cattab-pharma": "Pharmaceuticals", "cattab-cosm": "Cosmetics & Chemicals", "cattab-nonprod": "Non-food Goods", "cattab-auto": "Auto Parts", "cattab-electro": "Electronics", "cattab-pilot": "Pilot Projects",
        "faq-q1": "How much does turnkey labeling cost?", "faq-q2": "Which marketplaces are supported?", "faq-q3": "What is Honest ZNAK and is labeling mandatory?", "faq-q4": "Do you work with Kyrgyzstan (Teksher KG)?", "faq-q5": "How quickly can labeling be started?", "faq-q6": "Is a digital signature (EDS) required?",
        "faq-a1": "Pricing starts at <strong>23,290 ₽/month</strong>. KIZs are already included — no extra charge per code. Personal account top-up is done by us.",
        "faq-a2": "We work with <strong>Wildberries, Ozon, Yandex Market, Megamarket</strong> and Zolotoye Yabloko. We generate and sign UPD, handle goods circulation.",
        "faq-a3": "Honest ZNAK is Russia's mandatory goods labeling system. Selling most product categories without labeling is <strong>prohibited</strong>. We handle everything.",
        "faq-a4": "Yes! We work with <strong>Teksher KG</strong> — Kyrgyzstan's equivalent of Honest ZNAK. We set up EDO, help register goods and pass all checks.",
        "faq-a5": "We handle everything: registering your Honest ZNAK account, creating product cards, ordering KIZs and the first marketplace shipment.",
        "faq-a6": "Working with Honest ZNAK requires a qualified digital signature (QES). <strong>We help you obtain it</strong> and set everything up — no tech knowledge needed.",
        "czc-clothes": "Clothing", "czc-shoes": "Footwear", "czc-bedding": "Bedding", "czc-knitwear": "Knitwear", "czc-bags": "Bags & Leather", "czc-fur": "Fur Coats", "czc-water": "Bottled Water", "czc-sweets": "Confectionery", "czc-petfood": "Pet Food", "czc-drinks": "Non-alcoholic", "czc-meds": "Medicines", "czc-meddev": "Medical Devices", "czc-bads": "Supplements", "czc-vet": "Vet Drugs", "czc-optics": "Optics", "czc-antisep": "Antiseptics", "czc-perfume": "Perfumery", "czc-cosm": "Cosmetics", "czc-chem": "Household Chem.", "czc-hygiene": "Hygiene Goods", "czc-soap": "Soap & Detergents", "czc-furniture": "Furniture", "czc-kids": "Kids Goods", "czc-build": "Building Materials", "czc-techtext": "Technical Textile", "czc-tires": "Tires", "czc-autoparts": "Auto Parts", "czc-bikes": "Bikes & Scooters", "czc-phones": "Smartphones", "czc-laptops": "Laptops & PCs", "czc-photo": "Photo & Video", "czc-gaming": "Gaming Consoles", "czc-garden": "Garden Goods", "czc-sport": "Sport Goods"
      },
      kg: {
        "nav-cat": "Тармактар", "nav-news": "Жаңылыктар", "nav-tek": "Текшер", "nav-price": "Тарифтер", "nav-req": "Билдирүү калтыруу",
        "hero-h1": "Ачкычка чейин<br><span>«Честный ЗНАК»</span><br>маркировкасы",
        "hero-p": "Сатуучуларды жана импорттоочуларды түйшүктөн арылтабыз. Айып пулсуз маркетплейстерге жөнөтүү үчүн туура жүгүртүүгө киргизүү, карточкаларды түзүү жана УПД байлоо.",
        "hero-btn": "Баштоо", "mp-title": "Маркетплейстер менен иштейбиз",
        "cat-title": "Бардык <span>категориялар</span> менен иштейбиз", "cat-sub": "Ар бир милдеттүү товардык топ үчүн «ачкычка чейин» даяр чечимдер.",
        "proc-title": "Честный ЗНАК маркировкалоо процесси",
        "proc-1": "«Честный знак»<br>системасында жеке<br>кабинетти каттайбыз", "proc-2": "Ар бир товардын<br>карточкаларын сүрөттөп,<br>модерациядан өткөрөбүз", "proc-3": "Керектүү санда<br>товардын маркировкасын<br>буйрутма кылабыз", "proc-4": "Товарды жүгүртүүгө<br>киргизебиз жана<br>чыгарабыз", "proc-5": "УПД түзүп,<br>кол коёбуз", "proc-6": "Товарларды маркировкалоодо<br>убактыңызды<br>үнөмдөйбүз",
        "cz-sub": "улуттук санариптик<br>маркировкалоо системасы", "crpt-sub": "Перспективалуу<br>технологияларды өнүктүрүү<br>борбору", "tek-logo": "ТЕКШЕР",
        "tek-badge": "РФтеги биринчи", "tek-title": "<span>Текшер KG</span> менен<br>ишенимдүү интеграция",
        "tek-desc": "Кыргызстандын маркировкалоо системасы менен үзгүлтүксүз иштөө үчүн ЭДОну жөнгө салабыз. Сиздин партияңыз бажыдан өтүп, маркетплейстерде кабыл алынышы үчүн товарды мыйзамдуу жүгүртүүгө киргизүүгө жардам беребиз.",
        "tek-btn": "Интеграцияны кошуу",
        "pr-title": "Маркировкалоо тарифтери", "pr-desc": "КИЗдер тарифтерге киргизилген, жеке кабинетти толуктоо <span>0,61₽/КИЗ</span>",
        "pr-1m": "1 ай", "pr-3m": "3 ай", "pr-6m": "6 ай", "pr-12m": "12 ай",
        "pr-select": "Тандоо", "pr-hit": "ХИТ САТУУЧУЛАР",
        "pr-sub-3": "20 996₽/ай", "pr-sub-6": "18 665₽/ай", "pr-sub-12": "16 249₽/ай",
        "pr-vip": "VIP", "pr-vip-sub": "100 000 КИЗден баштап", "pr-vip-badge": "ЖЕКЕЧЕ ДОЛБООР", "pr-vip-btn": "ВКонтактеге жазуу",
        "f-title": "Тарифке эмнелер кирет:",
        "f-1": "ГС1 жана «Честный знак» сервистеринде каттоо", "f-2": "«Честный знак» системасында товар карточкаларын түзүү", "f-3": "Маркировка коддорун түзүү жана жүгүртүүгө киргизүү", "f-4": "Маркировкаларды маркетплейстерге өткөрүп берүү (УПД)", "f-5": "Продукцияны жүгүртүүдөн чыгаруу", "f-6": "Этикетка үчүн шаблон тандоо",
        "f-ul1": "ЧЕКСИЗ", "f-ul2": "ЧЕКСИЗ", "f-ul3": "ЧЕКСИЗ", "f-ul4": "ЧЕКСИЗ",
        "n-title": "Актуалдуу <span>жаңылыктар</span>", "n-sub": "Маркировкалоо эрежелериндеги акыркы өзгөртүүлөрдүн корутундусу.", "n-sync": "Серверлер менен синхрондоштуруу", "n-load": "Честный ЗНАК корутундулары жүктөлүүдө...",
        "ft-desc": "Сатуучулар жана өндүрүүчүлөр үчүн санариптик маркировкалоо процесстерин профессионалдык автоматташтыруу жана аутсорсинг.",
        "ft-nav": "Навигация", "ft-l1": "Товар категориялары", "ft-l2": "Текшер интеграциясы", "ft-l3": "Тарифтер", "ft-l4": "Жаңылыктар",
        "ft-cont": "Байланыш үчүн маалыматтар", "ft-tg": "Telegram коомчулугу: @markirovka57", "ft-wa": "WhatsApp аркылуу жазуу",
        "pop-title": "Биздин Сатуучулар коомчулугубузга кошулуңуз!", "pop-btn": "Телеграмга өтүү",
        "m-title": "Биз менен байланышыңыз", "m-desc": "Байланышуу үчүн ыңгайлуу мессенджерди тандаңыз.",
        "m-btn1": "Telegramга жазуу", "m-btn2": "WhatsAppка жазуу", "m-btn3": "ВКонтактеге жазуу",
        "sub-clothes": "Кийимди маркировкалоо", "sub-shoes": "Бут кийимди маркировкалоо", "sub-bads": "БАДдарды маркировкалоо", "sub-mp": "Маркетплейстер үчүн",
        "faq-title": "Көп берилүүчү суроолор", "faq-sub": "Честный ЗНАК маркировкасы боюнча билишиңиз керек болгон нерселердин баары",
        "whatmark-sub": "Честный ЗНАК милдеттүү маркировкасы боюнча товар топторунун толук тизмеси",
        "tp-badge": "🔥 САТУУЧУЛАР ҮЧҮН МААНИЛҮҮ",
        "tp-title": "WB же Ozon аркылуу товар сатасызбы?<br><span>Текшер KG — мыйзамдуу импорттун ачкычы</span>",
        "tp-desc": "Кыргызстандын расмий маркировка системасы. Товарларды ЕАЭБ аркылуу Честный ЗНАКсыз көйгөйсүз ввозунуз.",
        "tp-cta": "Кененирээк билүү",
        "cattab-clothes": "Кийим жана бут кийим", "cattab-food": "Суусундуктар жана азык-түлүк", "cattab-pharma": "Фармацевтика", "cattab-cosm": "Косметика жана химия", "cattab-nonprod": "Азык эмес товарлар", "cattab-auto": "Автотовар", "cattab-electro": "Электроника", "cattab-pilot": "Пилоттук долбоорлор",
        "faq-q1": "Ачкычка чейин маркировка канча турат?", "faq-q2": "Кандай маркетплейстер колдоого алынат?", "faq-q3": "Честный ЗНАК деген эмне жана маркировка милдеттүүбү?", "faq-q4": "Кыргызстан (Текшер KG) менен иштейсизби?", "faq-q5": "Маркировканы канча убакытта баштаса болот?", "faq-q6": "Иштөө үчүн ЭЦП (санарип кол тамга) керекпи?",
        "faq-a1": "Баасы <strong>айына 23 290 ₽ден</strong> башталат. КИЗ тарифтерге кирет — ар бир код үчүн кошумча төлөбөйсүз.",
        "faq-a2": "<strong>Wildberries, Ozon, Яндекс Маркет, Мегамаркет</strong> жана Золотое Яблоко менен иштейбиз. УПД түзөбүз жана кол коебуз.",
        "faq-a3": "Честный ЗНАК — Россиядагы товарларды милдеттүү маркировкалоо мамлекеттик системасы. Маркировкасыз сатуу <strong>тыюу салынган</strong>.",
        "faq-a4": "Ооба! Биз <strong>Текшер KG</strong> менен иштейбиз — Кыргызстандагы Честный ЗНАКтын аналогу. ЭДО орнотобуз, товарды жүгүртүүгө киргизебиз.",
        "faq-a5": "Биз баарын өз мойнубузга алабыз: Честный ЗНАК кабинетин каттоо, товар карточкаларын жазуу, КИЗ заказ кылуу жана маркетплейске биринчи жөнөтүү.",
        "faq-a6": "Честный ЗНАК системасы менен иштөө үчүн квалификациялуу электрондук кол тамга (КЭП) керек. <strong>Биз аны жактырып берүүгө жардамдашабыз.</strong>",
        "czc-clothes": "Кийим", "czc-shoes": "Бут кийим", "czc-bedding": "Төшөк жабдуулары", "czc-knitwear": "Трикотаж", "czc-bags": "Сумкалар", "czc-fur": "Мех буюмдар", "czc-water": "Таза суу", "czc-sweets": "Кондитердик", "czc-petfood": "Жаныбар азыгы", "czc-drinks": "Суусундуктар", "czc-meds": "Дарылар", "czc-meddev": "Медициналык", "czc-bads": "БАДдар", "czc-vet": "Ветпрепараттар", "czc-optics": "Көзайнек", "czc-antisep": "Антисептик", "czc-perfume": "Жыпар", "czc-cosm": "Косметика", "czc-chem": "Бытхимия", "czc-hygiene": "Гигиена", "czc-soap": "Сабын", "czc-furniture": "Эмерек", "czc-kids": "Балдар товарлары", "czc-build": "Курулуш", "czc-techtext": "Тех. текстиль", "czc-tires": "Шиналар", "czc-autoparts": "Автобөлүктөр", "czc-bikes": "Велосипеддер", "czc-phones": "Смартфондор", "czc-laptops": "Ноутбуктар", "czc-photo": "Фото/Видео", "czc-gaming": "Оюн консолдор", "czc-garden": "Бак-чарба", "czc-sport": "Спорт товарлар"
      }
    };

    window.setLang = function(lang) {
      document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById('lang-' + lang);
      if(activeBtn) activeBtn.classList.add('active');
      document.documentElement.setAttribute('lang', lang === 'kg' ? 'ky' : lang);
      document.documentElement.setAttribute('data-lang', lang);
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[lang] && dict[lang][key]) { el.innerHTML = dict[lang][key]; }
      });
    }

});
