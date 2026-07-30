const { defineConfig } = require('vitest/config')

module.exports = defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'tests/**/*.test.js'],
    restoreMocks: true,
  },
})
