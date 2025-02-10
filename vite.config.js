import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import dotenv from 'dotenv';

dotenv.config(); // ✅ Load environment variables

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173, // Ensure Vite runs on port 5173
    },
})
