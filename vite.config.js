import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  // Базовый путь важен для GitHub Pages, если сайт не на кастомном домене. 
  // Так как у нас привязан krasmatrix.com, оставляем корень:
  base: '/', 
  build: {
    target: 'es2015',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Разделяем вендорные скрипты и наш код для лучшего кэширования
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  plugins: [
    ViteImageOptimizer({
      webp: { quality: 80 },
      avif: { quality: 70 },
      jpg: { quality: 80 },
      png: { quality: 80, compressionLevel: 8 },
    }),
    createHtmlPlugin({
      minify: true, // Убирает все пробелы и комментарии из финального HTML
    }),
  ],
});
