import {defineConfig} from 'vite';
export default defineConfig({base:'./',resolve:{preserveSymlinks:true},server:{host:'127.0.0.1',port:5173,strictPort:true},build:{target:'es2020'}});

