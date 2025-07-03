/**
 * ESLint Configuration for CoTrain Monorepo
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-custom`
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: [
      './tsconfig.json',
      './apps/backend/tsconfig.json',
      './apps/frontend/tsconfig.json',
      './packages/shared-config/tsconfig.json',
      './packages/shared-types/tsconfig.json',
      './packages/shared-utils/tsconfig.json'
    ],
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          './tsconfig.json',
          './apps/backend/tsconfig.json',
          './apps/frontend/tsconfig.json',
          './packages/shared-config/tsconfig.json',
          './packages/shared-types/tsconfig.json',
          './packages/shared-utils/tsconfig.json'
        ],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    // Base ESLint rules
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': 'off', // Handled by TypeScript
    'no-use-before-define': 'off', // Handled by TypeScript
    'no-shadow': 'off', // Handled by TypeScript
    'no-undef': 'off', // Handled by TypeScript
    'no-redeclare': 'off', // Handled by TypeScript
    'no-restricted-imports': [
      'error',
      {
        patterns: ['../*'],
      },
    ],
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    
    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',
    'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
    'react/jsx-boolean-value': ['warn', 'never'],
    'react/self-closing-comp': 'warn',
    'react/jsx-fragments': ['warn', 'syntax'],
    'react/jsx-no-useless-fragment': 'warn',
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Import rules
    'import/no-unresolved': 'error',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'warn',
    'import/no-cycle': 'warn',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'warn',
    
    // Prettier rules
    'prettier/prettier': 'warn',
  },
  overrides: [
    // JavaScript files
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    // TypeScript files
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      },
    },
    // Test files
    {
      files: ['**/__tests__/**/*', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    // Configuration files
    {
      files: [
        '*.config.js',
        '*.config.ts',
        'vite.config.ts',
        'jest.config.js',
        'jest.setup.js',
        'tailwind.config.js',
        'postcss.config.js',
        'next.config.js',
        'turbo.json',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    // Next.js pages and API routes
    {
      files: ['apps/*/pages/**/*.{ts,tsx}', 'apps/*/app/**/*.{ts,tsx}', 'apps/*/src/pages/**/*.{ts,tsx}', 'apps/*/src/app/**/*.{ts,tsx}'],
      rules: {
        'import/no-default-export': 'off',
        'import/prefer-default-export': 'warn',
      },
    },
    // NestJS files
    {
      files: ['apps/backend/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/explicit-module-boundary-types': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'out/',
    'coverage/',
    'public/',
    'storybook-static/',
    '*.d.ts',
    '*.js.map',
    '*.d.ts.map',
    'vite.config.ts.timestamp-*',
    'generated/',
    '__generated__/',
    '*.generated.*',
    'Move.toml',
    '*.move',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
  ],
};