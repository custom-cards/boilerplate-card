import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: 'src/editor.ts',
    output: {
      file: 'boilerplate-card-editor.js',
      format: 'es',
    },
    plugins: [resolve(), typescript()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'boilerplate-card.js',
      format: 'es',
    },
    plugins: [resolve(), typescript()],
  },
];
