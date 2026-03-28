import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' })],
    external: ['@togglely/sdk-core'],
  },
  // CJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' })],
    external: ['@togglely/sdk-core'],
  },
  // UMD build (for CDN) - self-contained, bundles @togglely/sdk-core
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'Togglely',
      sourcemap: true,
    },
    plugins: [
      resolve({ browser: true, preferBuiltins: false }),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    // No external - everything is bundled for CDN usage
  },
  // UMD minified build (for CDN) - self-contained, bundles @togglely/sdk-core
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'Togglely',
      sourcemap: true,
    },
    plugins: [
      resolve({ browser: true, preferBuiltins: false }),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
    // No external - everything is bundled for CDN usage
  },
]
