import fs from "fs";
import { defu } from "defu";

export class AgentConfig {
  constructor(configPath = "agents/.agent-config.json") {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const userConfig = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
      return this.mergeWithDefaults(userConfig);
    } catch (error) {
      console.log("📝 No config found, creating default configuration...");
      return this.createDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      // Global settings (defaults for all agents)
      global: {
        model: "mixtral-8x7b-32768",
        maxTokens: 2000,
        enabled: true,
      },

      // Code reviewer settings
      codeReviewer: {
        enabled: true,
        model: "llama-3.3-70b-versatile",
        maxTokens: null, // Uses global.maxTokens if not specified
        focusAreas: [
          "bugs or issues",
          "security",
          "performance",
          "correctness",
        ],
        severity: "medium", // low, medium, high
        excludePatterns: [
          "*.test.*",
          "*.spec.*",
          "**/node_modules/**",
          "docs/**",
          "**/dummy-data/**",
          "*.config.*",
          "package*.json",
        ],
        teamStandards: {
          maxFunctionLength: 50,
          requireJSDoc: false,
          enforceCamelCase: true,
        },
      },

      // Bug fixer settings
      bugFixer: {
        enabled: true,
        model: "llama-3.3-70b-versatile", // Cheaper model for simple fixes
        maxTokens: 1500, // Reduced tokens for cost control
        attemptComplexFixes: false,
        maxAttemptsPerFile: 3,
        excludePatterns: [
          "*.test.*",
          "*.spec.*",
          "**/node_modules/**",
          "docs/**",
          "**/dummy-data/**",
          "**/github-actions/**",
          "*.config.*",
          "package*.json",
        ],
        safetyLevel: "medium", // low, medium, high
        autoCommit: true,
      },

      // Documentation writer settings
      documentationWriter: {
        enabled: true,
        model: null,
        maxTokens: 3000, // More tokens for detailed docs
        style: "standard", // brief, standard, comprehensive
        includeExamples: true,
        voiceAndTone: "professional", // casual, professional, technical
        generateReadme: true,
      },

      prompts: {
        codeReviewer: {
          template: "default",
          customVariables: {},
        },
        bugFixer: {
          template: "default",
          customVariables: {},
        },
        documentationWriter: {
          template: "comprehensive",
          customVariables: {},
        },
      },
    };
  }

  mergeWithDefaults(userConfig) {
    const defaults = this.getDefaultConfig();
    return defu(userConfig, defaults);
  }

  createDefaultConfig() {
    const config = this.getDefaultConfig();
    this.saveConfig(config);
    console.log("✅ Created default configuration file");
    return config;
  }

  saveConfig(config = this.config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Configuration saved to ${this.configPath}`);
  }

  // Easy access to agent-specific configs
  get codeReviewer() {
    return this.config.codeReviewer;
  }

  get bugFixer() {
    return this.config.bugFixer;
  }

  get documentationWriter() {
    return this.config.documentationWriter;
  }

  get global() {
    return this.config.global;
  }

  get prompts() {
    return this.config.prompts;
  }

  // Configuration helpers
  isAgentEnabled(agentName) {
    return this.config[agentName]?.enabled && this.config.global.enabled;
  }

  shouldSkipFile(agentName, filename) {
    const excludePatterns = this.config[agentName]?.excludePatterns || [];

    return excludePatterns.some((pattern) => {
      // Convert glob pattern to regex
      const regex = new RegExp(
        pattern.replace(/\*/g, ".*").replace(/\?/g, ".")
      );
      return regex.test(filename);
    });
  }
}
