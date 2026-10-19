import {defineConfig} from 'vite';

export default defineConfig({
  base:'./',
  resolve:{preserveSymlinks:true},
  server:{host:'127.0.0.1',port:5173,strictPort:true},
  build:{
    target:'es2020',
    rollupOptions:{output:{manualChunks(id) {
      const path=id.replace(/\\/g,'/');
      if(path.endsWith('/src/works.json')) return 'portfolio-data';
      if(path.includes('/node_modules/')) return path.includes('/motion') || path.includes('/framer-motion') ? 'motion' : 'react-vendor';
    }}}
  }
});

