export const reviewConfigs = {
  quick: {
    model: "llama-3.1-8b-instant",
    maxTokens: 800,
    focus: "bugs and obvious issues",
  },
  thorough: {
    model: "mixtral-8x7b",
    maxTokens: 2000,
    focus: "comprehensive analysis including architecture",
  },
  security: {
    model: "mixtral-8x7b",
    maxTokens: 1500,
    focus: "security vulnerabilities and input validation",
  },
  performance: {
    model: "llama-3.1-8b-instant",
    maxTokens: 1500,
    focus: "performance optimization and efficiency",
  },
};

export function getConfig(type = "quick") {
  return reviewConfigs[type] || reviewConfigs.quick;
}
