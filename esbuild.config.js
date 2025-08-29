/**
 * @file: esbuild.config.js
 * @description: Конфигурация ESBuild для сборки плагина
 * @created: 2024-12-19
 */

const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['plugin/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  format: 'iife',
  target: 'es2017',
  platform: 'browser',
  external: ['figma'],
  sourcemap: true,
  minify: process.argv.includes('--minify'),
  watch: process.argv.includes('--watch'),
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  resolveExtensions: ['.ts', '.js']
}).catch(() => process.exit(1))
