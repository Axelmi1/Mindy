module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Les specs vivent hors de app/ : expo-router bundle TOUT ce qui est dans app/,
  // donc un *.spec.ts là-bas planterait au runtime (describe/jest indéfinis).
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/__tests__/**/*.spec.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
};
