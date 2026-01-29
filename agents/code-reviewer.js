// From AIDD Course module 3: Build Your First Strategic Agent (modified to use Groq)
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { AgentConfig } from "./agent-config.js";
import { PromptTemplateEngine } from "./prompt-templates.js";

class CodeReviewer {
  constructor(configPath) {
    this.agentConfig = new AgentConfig(configPath);
    this.promptEngine = new PromptTemplateEngine();
    this.settings = this.agentConfig.codeReviewer;
    this.promptSettings = this.agentConfig.prompts.codeReviewer;
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Check if agent is enabled
    if (!this.agentConfig.isAgentEnabled("codeReviewer")) {
      console.warn("⚠️  Code Reviewer is disabled in configuration");
    }
  }

  async reviewFile(filename) {
    // Check if agent is enabled
    if (!this.agentConfig.isAgentEnabled("codeReviewer")) {
      return {
        filename,
        skipped: true,
        reason: "disabled",
        timestamp: new Date().toISOString(),
      };
    }

    // Check if file should be skipped
    if (this.agentConfig.shouldSkipFile("codeReviewer", filename)) {
      return {
        filename,
        skipped: true,
        reason: "excluded",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const code = fs.readFileSync(filename, "utf8");
      const language = this.detectLanguage(filename);

      console.log(
        `🔍 Reviewing ${filename} with '${this.promptSettings.template}' template...`
      );

      const analysis = await this.reviewWithTemplate(code, filename, language);

      return {
        filename,
        language,
        analysis,
        template: this.promptSettings.template,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        filename,
        error: error.message || String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async reviewWithTemplate(code, filename, language) {
    const variables = {
      code,
      filename,
      language,
      focusAreas: this.settings.focusAreas,
      severity: this.settings.severity,
      teamStandards: JSON.stringify(this.settings.teamStandards, null, 2),
      ...this.promptSettings.customVariables, // Allow custom variables from config
    };

    const prompt = this.promptEngine.getTemplate(
      "codeReviewer",
      this.promptSettings.template,
      variables
    );

    const model = this.settings.model || this.agentConfig.global.model;
    const maxTokens =
      this.settings.maxTokens || this.agentConfig.global.maxTokens;

    const completion = await this.groq.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful code reviewer. You provide accurate, actionable feedback based on actual code issues. You never report false positives. You understand framework-specific patterns (React, etc.) and only flag real problems with clear evidence.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.1,
    });

    return completion.choices[0].message.content;
  }

  detectLanguage(filename) {
    const ext = path.extname(filename);
    const languageMap = {
      ".js": "javascript",
      ".ts": "typescript",
      ".jsx": "javascript",
      ".tsx": "typescript",
      ".py": "python",
      ".go": "go",
      ".rs": "rust",
      ".java": "java",
    };
    return languageMap[ext] || "javascript";
  }
}

// CLI interface
async function main() {
  const filename = process.argv[2];

  if (!filename) {
    console.log("Usage: node code-reviewer.js <filename>");
    console.log("Example: node code-reviewer.js src/utils.js");
    process.exit(1);
  }

  if (!fs.existsSync(filename)) {
    console.error(`File not found: ${filename}`);
    process.exit(1);
  }

  console.log(`🔍 Reviewing ${filename}...`);

  const reviewer = new CodeReviewer();
  const result = await reviewer.reviewFile(filename);

  if (result.error) {
    console.error(`❌ Error reviewing ${filename}:`);
    console.error(result.error);
    return;
  }

  console.log(`\n📋 Code Review Results for ${result.filename}`);
  console.log(`Language: ${result.language}`);
  console.log(`Reviewed: ${result.timestamp}`);
  console.log("\n" + "=".repeat(60));
  console.log(result.analysis);
  console.log("=".repeat(60));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CodeReviewer };
