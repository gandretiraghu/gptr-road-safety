
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Vital: We inject the keys specifically into process.env for compatibility
      'process.env': {
        API_KEY: env.API_KEY,
        VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
