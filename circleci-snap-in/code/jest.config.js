module.exports = {
  roots: ['./src'],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text"],
  coverageThreshold: {
    "**/*": {
      branches: 60,
    },
  },
  preset: "ts-jest",
  testEnvironment: "node",
};
