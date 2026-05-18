import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  base: '/', // Т.к. у тебя привязан кастомный домен krasmatrix.com (файл CNAME)
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        // Разбиваем бандл, чтобы кэш браузера работал эффективнее
        manualChunks: undefined,
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  },
  plugins: [
    ViteImageOptimizer({
      webp: { quality: 80 },
      svg: { multipass: true },
    }),
    createHtmlPlugin({
      minify: true, // Полностью жмет index.html (убирает пробелы, комменты)
    }),
  ],
});
