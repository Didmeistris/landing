document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Делегирование событий для кнопок (Performance)
    // Вешаем один слушатель на body вместо десятков на каждую кнопку
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('a[href^="#"]');
        if (btn) {
            // Если браузер не поддерживает CSS scroll-behavior, фоллбэк на JS
            const targetId = btn.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    // 2. Intersection Observer (вместо тормозного onScroll)
    // Запускает анимации секций только когда они появляются в области видимости
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Снимаем слежение после появления (экономия CPU)
                }
            });
        }, { 
            rootMargin: '0px 0px -10% 0px', // Триггер срабатывает чуть раньше
            threshold: 0.1 
        });

        document.querySelectorAll('.features-grid, .social-proof, .cta').forEach(el => {
            el.classList.add('fade-in'); // Добавляем класс скрытия
            observer.observe(el);
        });
    }
});
