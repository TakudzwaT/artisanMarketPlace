module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Regex literal instead of a string
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },

  // Add coverage config
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.test.{js,jsx,ts,tsx}",
    "!src/**/index.{js,jsx,ts,tsx}"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text"],

  // Optional: if you want to ignore test files from coverage, else you can remove this
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/coverage/"
  ]
};
