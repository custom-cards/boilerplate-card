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
  input: ['src/boilerplate-card.ts'],
  output: {
    dir: './dist',
    format: 'es',
    inlineDynamicImports: true,
    entryFileNames: '[name].js', // Generates boilerplate-card.js without hash
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
    polling: 2000, // Poll every 2000ms for file changes (slower but more reliable on docker mounts)
    debounce: 500, // Wait 500ms after last change before rebuilding
  },
  onwarn,
};
