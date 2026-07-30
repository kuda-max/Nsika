import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Target older browsers (Chrome 60+ / Android 8+)
    target: 'es2015',
    cssTarget: 'chrome61',
  },
});