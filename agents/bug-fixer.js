// From AIDD Course module 3: Build Your Second Strategic Agent - Bug Fixer (modified to use Groq)
import "./utils/config.js";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import prettier from "prettier";
import { AgentConfig } from "./agent-config.js";
import { PromptTemplateEngine } from "./prompt-templates.js";

class BugFixer {
  constructor(options = {}) {
    this.agentConfig = new AgentConfig();
    this.settings = this.agentConfig.bugFixer;
    this.global = this.agentConfig.global;
    this.promptSettings = this.agentConfig.prompts.bugFixer;
    this.promptEngine = new PromptTemplateEngine();
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Model configuration (can be overridden by options)
    this.model = options.model || this.settings.model || this.global.model;
    this.maxTokens =
      options.maxTokens || this.settings.maxTokens || this.global.maxTokens;

    // Check if agent is enabled
    if (!this.agentConfig.isAgentEnabled("bugFixer")) {
      console.warn("⚠️  Bug Fixer is disabled in configuration");
    }
  }

  async fixBug(filename, errorMessage = "", skipTests = true) {
    console.log(`🔍 Analyzing bug in ${filename}...`);

    // Step 1: Read original code
    const originalCode = fs.readFileSync(filename, "utf8");

    // Step 2: Generate the fix
    const fixedCode = await this.analyzeBug(
      originalCode,
      filename,
      errorMessage
    );

    // Step 3: Apply fix and test
    const success = await this.applyAndTest(
      filename,
      originalCode,
      fixedCode,
      skipTests
    );

    if (success) {
      console.log("🎉 Bug fixed successfully!");
      return { success: true, fixedCode };
    } else {
      console.log("💥 Couldn't create a working fix");
      return { success: false };
    }
  }

  async analyzeBug(code, filename, errorMessage) {
    const language = this.detectLanguage(filename);
    const variables = {
      filename,
      language,
      code,
      errorMessage: errorMessage || "Analyze the code for potential issues",
      safetyLevel: this.settings.safetyLevel || "medium",
      ...this.promptSettings.customVariables,
    };

    console.log(
      `🔧 Using '${this.promptSettings.template}' template for bug fixing...`
    );

    const prompt = this.promptEngine.getTemplate(
      "bugFixer",
      this.promptSettings.template,
      variables
    );

    const completion = await this.groq.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    return this.cleanCodeResponse(rawResponse);
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

  cleanCodeResponse(text) {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/, "");
    return cleaned.trim();
  }

  async formatCode(code, filename) {
    try {
      const ext = filename.split(".").pop().toLowerCase();
      const parserMap = {
        js: "babel",
        jsx: "babel",
        ts: "typescript",
        tsx: "typescript",
        json: "json",
        css: "css",
        scss: "scss",
        html: "html",
        md: "markdown",
      };

      const parser = parserMap[ext] || "babel";

      const formatted = await prettier.format(code, {
        parser,
        semi: true,
        singleQuote: false,
        tabWidth: 2,
        trailingComma: "es5",
      });

      console.log("✨ Code formatted with Prettier");
      return formatted;
    } catch (error) {
      console.log("⚠️  Prettier formatting failed, using unformatted code");
      return code;
    }
  }

  async applyAndTest(filename, originalCode, fixedCode, skipTests = false) {
    const formattedCode = await this.formatCode(fixedCode, filename);
    fs.writeFileSync(filename, formattedCode);
    console.log("🔧 Applied potential fix, testing...");

    if (skipTests) {
      console.log("⚠️  Skipping tests (use with caution)");
      return true;
    }

    try {
      execSync("npm test", { stdio: "pipe" });
      console.log("✅ Tests passed! Fix is working.");
      return true;
    } catch (error) {
      fs.writeFileSync(filename, originalCode);
      console.log("❌ Tests failed, rolled back to original code");
      return false;
    }
  }
}

// CLI interface
async function main() {
  const filename = process.argv[2];
  const errorMessage = process.argv[3];

  if (!filename) {
    console.log("Usage: node bug-fixer.js <filename> [error-message]");
    console.log("Examples:");
    console.log("  node bug-fixer.js src/payment.js");
    console.log(
      '  node bug-fixer.js utils.js "Cannot read property of undefined"'
    );
    process.exit(1);
  }

  if (!fs.existsSync(filename)) {
    console.error(`File not found: ${filename}`);
    process.exit(1);
  }

  const bugFixer = new BugFixer();
  const result = await bugFixer.fixBug(filename, errorMessage);

  if (result.success) {
    console.log("🎉 Bug fixed! Review the changes and commit when ready.");
  } else {
    console.log("💥 Could not automatically fix the bug");
    console.log("You may need to fix this manually or provide more context");
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { BugFixer };
