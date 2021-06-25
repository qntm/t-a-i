/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  commandRunner: {
    command: 'jest'
  },
  jest: {
    // <https://github.com/stryker-mutator/stryker-js/issues/2122>
    enableFindRelatedTests: false
  }
}
