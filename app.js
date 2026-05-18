document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // 1. ОПТИМИЗАЦИЯ СКРОЛЛА (без querySelector на каждый пиксель!)
    const header = document.querySelector('.header-wrapper');
    if (header) {
        let isScrolled = false;
        window.addEventListener('scroll', () => {
            // Кэшируем состояние, чтобы не дергать DOM лишний раз
            const shouldScroll = window.scrollY > 20;
            if (shouldScroll !== isScrolled) {
                isScrolled = shouldScroll;
                header.classList.toggle('scrolled', isScrolled);
            }
        }, { passive: true }); // passive: true снижает нагрузку на CPU
    }

    // 2. ОТЛОЖЕННАЯ ЗАГРУЗКА TELEGRAM-ВИДЖЕТА (Intersection Observer)
    // Виджет будет грузиться ТОЛЬКО когда пользователь доскроллит до него за 300px
    const tgFeed = document.getElementById('tg-feed');
    if (tgFeed) {
        const observer = new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                initTelegramWidget(tgFeed);
                obs.disconnect(); // Уничтожаем обзервер после загрузки
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
        
        script.onerror = () => container.innerHTML = '<p style="color: #fff;">Ошибка загрузки виджета Telegram. <a href="https://t.me/markirovka57">Перейти в канал</a></p>';
        wrap.appendChild(script);
        container.appendChild(wrap);
    }

    // 3. ОПТИМИЗАЦИЯ НОВОСТЕЙ С КЭШИРОВАНИЕМ (чтобы не забанили прокси)
    // Сохраняем новости в sessionStorage на 15 минут
    const CACHE_KEY = 'krasmatrix_news';
    const CACHE_TTL = 15 * 60 * 1000; // 15 минут

    function loadLiveNews() {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                renderNews(data);
                return;
            }
        }

        // Если кэша нет или он устарел – делаем запрос (оставляю твою логику парсинга, но оборачиваю в Promise)
        Promise.all([
            fetchProxyData('https://xn--80ajghhoc2aj1c8b.xn--p1ai/rss/news/'),
            fetchProxyData('https://main.teksher.kg/feed/')
        ]).then(([czNews, tekNews]) => {
            const combinedNews = [...czNews, ...tekNews].sort((a, b) => new Date(b.date) - new Date(a.date));
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: combinedNews }));
            renderNews(combinedNews);
        }).catch(err => console.error("Ошибка обновления новостей", err));
    }

    async function fetchProxyData(targetUrl) {
        // Используем один надежный прокси, если не сработает - вернем пустой массив
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        try {
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
            const data = await res.json();
            return parseNews(data.contents || ''); // Твоя функция parseXML/parseJSON
        } catch (e) {
            return [];
        }
    }

    // Твоя функция парсинга XML остается здесь...
    function parseNews(raw) { /* ... */ return []; }
    function renderNews(newsData) { /* ... */ }

    // Запускаем новости чуть позже, чтобы не блокировать загрузку первого экрана
    setTimeout(loadLiveNews, 1500);
});

// Глобальная функция для переключения табов в HTML (чтобы onclick="czTab(...)" работал)
window.czTab = function(key, btn) {
    document.querySelectorAll('.cat-cz-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.cat-cz-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('czp-' + key).classList.add('active');
};
