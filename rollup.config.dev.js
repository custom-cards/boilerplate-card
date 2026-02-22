import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import serve from 'rollup-plugin-serve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

const onwarn = (warning, warn) => {
  if (warning.code === 'THIS_IS_UNDEFINED' && warning.id?.includes('/node_modules/')) {
    return;
  }

  warn(warning);
};

export default {
  input: 'src/boilerplate-card.ts',
  output: {
    file: './dist/boilerplate-card.js',
    format: 'es',
    inlineDynamicImports: true,
  },
  plugins: [
    resolve(),
    typescript(),
    json(),
    terser(),
    serve({
      contentBase: './dist',
      host: '0.0.0.0',
      port: 5000,
      allowCrossOrigin: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
    }),
  ],
  watch: {
    include: 'src/**',
    exclude: 'node_modules/**',
    buildDelay: 500,
    chokidar: {
      usePolling: true,  // Required for reliable file detection on Docker volume mounts
      interval: 1000,
    },
  },
  onwarn,
};
