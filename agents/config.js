export const agentConfigs = {
  // Code Reviewer configurations
  reviewer: {
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
  },

  // Bug Fixer configuration
  bugFixer: {
    model: "llama-3.3-70b-versatile",
    maxTokens: 3000,
    focus: "identifying and fixing bugs with code patches",
  },

  // Documentation Writer configuration
  docWriter: {
    model: "llama-3.3-70b-versatile",
    maxTokens: 2000,
    focus: "generating comprehensive technical documentation",
  },
};

// Legacy support for code reviewer
export const reviewConfigs = agentConfigs.reviewer;

export function getConfig(type = "quick", agent = "reviewer") {
  if (agent === "reviewer") {
    return agentConfigs.reviewer[type] || agentConfigs.reviewer.quick;
  }
  return agentConfigs[agent] || agentConfigs.reviewer.quick;
}
