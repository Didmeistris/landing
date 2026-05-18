import './style.css'; // Vite сам соберет и минифицирует этот CSS

// Оптимизированный слушатель для появления элементов
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Добавляем класс для запуска CSS-анимации
      entry.target.classList.add('is-visible');
      // Прекращаем следить за элементом после появления, экономя ресурсы
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Ищем все элементы, которые нужно анимировать при скролле
document.querySelectorAll('.fade-in').forEach((el) => {
  observer.observe(el);
});

// Пример пассивного слушателя (если нужен кастомный скролл или шапка)
// { passive: true } обязательно для 60 FPS на мобильных устройствах
window.addEventListener('scroll', () => {
  // Легкая логика...
}, { passive: true });
