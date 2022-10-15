import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import worktank from 'worktank-vite-plugin';

export default defineConfig({
  plugins: [
    solidPlugin(),
    worktank ({
      filter: /\.worker\.(js|ts)$/ // Files matching this regex will be processed
    })
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
