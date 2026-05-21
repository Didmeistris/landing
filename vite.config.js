import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/landing/', // Сохранение правильного пути для GitHub Pages
  build: {
    // Минификация CSS и JS
    cssMinify: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Убираем console.log в продакшене
        drop_debugger: true
      }
    },
    rollupOptions: {
      // Явно указываем все страницы, чтобы Vite их правильно скомпилировал
      input: {
        main: resolve(__dirname, 'index.html'),
        ozon: resolve(__dirname, 'ozon/index.html'),
        wildberries: resolve(__dirname, 'wildberries/index.html'),
        chestnyZnak: resolve(__dirname, 'chestny-znak/index.html'),
        teksher: resolve(__dirname, 'teksher/index.html'),
        404: resolve(__dirname, '404.html'),
      },
      output: {
        // Хеширование имен файлов (решает проблему с кэшем у пользователей при обновлениях сайта)
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
});
