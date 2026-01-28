// From AIDD Course module 3: Build Your First Strategic Agent (modified to use Groq)
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { AgentConfig } from "./agent-config.js";

class CodeReviewer {
  constructor() {
    const agentConfig = new AgentConfig();
    this.config = agentConfig.codeReviewer;
    this.global = agentConfig.global;
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Check if agent is enabled
    if (!agentConfig.isAgentEnabled("codeReviewer")) {
      console.warn("⚠️  Code Reviewer is disabled in configuration");
    }
  }

  async reviewFile(filename, agentConfig = null) {
    try {
      // Check if file should be skipped
      const config = agentConfig || new AgentConfig();
      if (config.shouldSkipFile("codeReviewer", filename)) {
        console.log(`⏭️  Skipping ${filename} (excluded by configuration)`);
        return {
          filename,
          skipped: true,
          reason: "excluded by configuration",
          timestamp: new Date().toISOString(),
        };
      }

      const code = fs.readFileSync(filename, "utf8");
      const fileExtension = path.extname(filename);
      const language = this.detectLanguage(fileExtension);

      const analysis = await this.analyzeCode(code, filename, language);

      return {
        filename,
        language,
        analysis,
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

  detectLanguage(extension) {
    const languages = {
      ".js": "JavaScript",
      ".ts": "TypeScript",
      ".jsx": "React JSX",
      ".tsx": "React TSX",
      ".py": "Python",
      ".go": "Go",
      ".rs": "Rust",
      ".java": "Java",
    };
    return languages[extension] || "Unknown";
  }

  async analyzeCode(code, filename, language) {
    const focusAreas = this.config.focusAreas.join(", ");
    const severity = this.config.severity;
    const teamStandards = this.config.teamStandards;

    const prompt = `You are an expert code reviewer. Focus on: ${focusAreas}.

Review this ${language} code with severity level: ${severity}

**Instructions:**
1. Read the ENTIRE code before identifying issues
2. Only report REAL issues (verify they exist in the code), and explain why they are issues
3. Be specific with line numbers
4. Provide actionable fixes with code examples

**Priority Areas:**
1. **Bugs and Logic Issues** - Potential runtime errors, edge cases, off-by-one errors
2. **Performance Concerns** - Inefficient algorithms, memory leaks, unnecessary operations
3. **Security Issues** - Input validation, SQL injection, XSS vulnerabilities
4. **Code Quality** - Readability, maintainability, adherence to best practices
5. **Testing Gaps** - Missing test cases, untestable code patterns

**Team Standards:**
- Max function length: ${teamStandards.maxFunctionLength} lines
- JSDoc required: ${teamStandards.requireJSDoc ? "Yes" : "No"}
- Enforce camelCase: ${teamStandards.enforceCamelCase ? "Yes" : "No"}

**Code to review (${filename}):**
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Provide specific, actionable feedback in this format:
- **Issue Type:** Brief description
- **Location:** Line number or function name
- **Problem:** What's wrong
- **Fix:** Specific recommendation
- **Priority:** High/Medium/Low

Only report issues at ${severity} severity or higher.`;

    const model = this.config.model || this.global.model;
    const maxTokens = this.config.maxTokens || this.global.maxTokens;

    const completion = await this.groq.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful code reviewer.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    });

    return completion.choices[0].message.content;
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
