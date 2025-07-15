/**
 * Jest Configuration for CoTrain Monorepo
 * @type {import('jest').Config}
 */
module.exports = {
  // The root directory that Jest should scan for tests and modules within
  rootDir: '.',

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/apps', '<rootDir>/packages'],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // Setup files after env
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFiles: [],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/out/',
    '<rootDir>/coverage/',
    '<rootDir>/storybook-static/',
    '<rootDir>/move/',
    '<rootDir>/.turbo/',
    '<rootDir>/.vercel/',
    '<rootDir>/.netlify/',
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    '^.+\\.css$': 'jest-transform-css',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': 'jest-transform-file',
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@aptos-labs|@manahippo|@pontem|@hippo-labs|@martianwallet|@petra-wallet|@rise-wallet|@fewcha-wallet|@blocto|@okx-wallet))',
  ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapping: {
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle image imports
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': '<rootDir>/__mocks__/fileMock.js',

    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',

    // Handle package aliases
    '^@cotrain/ui$': '<rootDir>/packages/ui/src/index.ts',
    '^@cotrain/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
    '^@cotrain/shared$': '<rootDir>/packages/shared/src/index.ts',
    '^@cotrain/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@cotrain/config$': '<rootDir>/packages/config/src/index.ts',
    '^@cotrain/config/(.*)$': '<rootDir>/packages/config/src/$1',
    '^@cotrain/utils$': '<rootDir>/packages/utils/src/index.ts',
    '^@cotrain/utils/(.*)$': '<rootDir>/packages/utils/src/$1',
    '^@cotrain/types$': '<rootDir>/packages/types/src/index.ts',
    '^@cotrain/types/(.*)$': '<rootDir>/packages/types/src/$1',
    '^@cotrain/hooks$': '<rootDir>/packages/hooks/src/index.ts',
    '^@cotrain/hooks/(.*)$': '<rootDir>/packages/hooks/src/$1',
    '^@cotrain/stores$': '<rootDir>/packages/stores/src/index.ts',
    '^@cotrain/stores/(.*)$': '<rootDir>/packages/stores/src/$1',
    '^@cotrain/move$': '<rootDir>/move/src/index.ts',
    '^@cotrain/move/(.*)$': '<rootDir>/move/src/$1',
  },

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', '<rootDir>'],

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/out/**',
    '!**/coverage/**',
    '!**/storybook-static/**',
    '!**/.storybook/**',
    '!**/stories/**',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/*.config.{js,ts}',
    '!**/jest.setup.js',
    '!**/next.config.js',
    '!**/tailwind.config.js',
    '!**/postcss.config.js',
    '!**/vite.config.ts',
    '!**/turbo.json',
    '!**/tsconfig.json',
    '!**/package.json',
    '!**/pnpm-workspace.yaml',
    '!**/.eslintrc.js',
    '!**/.prettierrc',
    '!**/move/**',
    '!**/*.move',
    '!**/Move.toml',
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // A path to a custom resolver
  resolver: undefined,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // An array of regexp patterns that are matched against all modules before the module loader will automatically return a mock for them
  unmockedModulePathPatterns: undefined,

  // Indicates whether each individual test should be reported during the run
  silent: false,

  // The number of seconds after which a test is considered as slow and reported as such in the results
  slowTestThreshold: 5,

  // A list of reporter names that Jest uses when writing coverage reports
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],

  // Test timeout
  testTimeout: 10000,

  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Projects configuration for monorepo
  projects: [
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/apps/frontend/**/*.(test|spec).{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/apps/backend/**/*.(test|spec).{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'packages',
      testMatch: ['<rootDir>/packages/**/*.(test|spec).{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'libs',
      testMatch: ['<rootDir>/libs/**/*.(test|spec).{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Preset
  preset: undefined,

  // Max workers
  maxWorkers: '50%',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest',

  // Error on deprecated
  errorOnDeprecated: true,

  // Notify mode
  notify: false,
  notifyMode: 'failure-change',

  // Bail
  bail: 0,

  // Force exit
  forceExit: false,

  // Detect open handles
  detectOpenHandles: false,

  // Detect leaked timers
  detectLeakedTimers: false,

  // Run tests in band
  runInBand: false,

  // Max concurrent tests
  maxConcurrency: 5,

  // Pass with no tests
  passWithNoTests: true,

  // Find related tests
  findRelatedTests: false,

  // List tests
  listTests: false,

  // Last commit
  lastCommit: false,

  // Changed files
  changedFilesWithAncestor: false,

  // Changed since
  changedSince: undefined,

  // Only changed
  onlyChanged: false,

  // Only failures
  onlyFailures: false,

  // Update snapshot
  updateSnapshot: false,

  // Use stderr
  useStderr: false,

  // Watch
  watch: false,
  watchAll: false,

  // Watch path ignore patterns
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/out/',
    '<rootDir>/coverage/',
    '<rootDir>/storybook-static/',
    '<rootDir>/.turbo/',
    '<rootDir>/.vercel/',
    '<rootDir>/.netlify/',
  ],
};