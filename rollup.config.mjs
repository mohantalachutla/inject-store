// rollup.config.js
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
const isProd = process.env.NODE_ENV === 'production'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'lib/index.js',
      format: 'esm',
    },
    {
      file: 'lib/index.cjs',
      format: 'cjs',
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    isProd && import('@rollup/plugin-terser').then((terser) => terser.default),
    // configure plugins for eslint, prettier, and husky
  ],
  external: ['redux', '@reduxjs/toolkit'],
}
