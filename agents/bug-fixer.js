import "./utils/config.js";
import Groq from "groq-sdk";
import fs from "fs";
import { execSync } from "child_process";
import prettier from "prettier";

class BugFixer {
  constructor(options = {}) {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.model = options.model || "llama-3.3-70b-versatile";
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
    const prompt = `You are an expert debugging agent. Fix this bug:

**File:** ${filename}
**Error:** ${errorMessage || "Analyze the code for potential issues"}

**Current Code:**
\`\`\`javascript
${code}
\`\`\`

**Instructions:**
1. Look at the error message and stack trace to identify the exact problem
2. Common bugs to check for:
   - Off-by-one errors in loops (use < instead of <=)
   - Array index out of bounds
   - Null/undefined checks
   - Missing error handling
3. Make ONLY the minimal fix needed to resolve the error
4. Do NOT refactor or add unnecessary changes
5. Preserve ALL existing code structure and functionality

**Return ONLY the corrected code with NO markdown, explanations, or comments about what you changed.**`;

    const completion = await this.groq.chat.completions.create({
      model: this.model,
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

  cleanCodeResponse(text) {
    // Remove markdown code fences that LLMs often add despite instructions
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/, "");
    return cleaned.trim();
  }

  async formatCode(code, filename) {
    try {
      // Determine parser based on file extension
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
    // Format the code with Prettier
    const formattedCode = await this.formatCode(fixedCode, filename);

    // Apply the fix
    fs.writeFileSync(filename, formattedCode);
    console.log("🔧 Applied potential fix, testing...");

    if (skipTests) {
      console.log("⚠️  Skipping tests (use with caution)");
      return true;
    }

    try {
      // Run tests to verify the fix
      execSync("npm test", { stdio: "pipe" });
      console.log("✅ Tests passed! Fix is working.");
      return true;
    } catch (error) {
      // Tests failed - rollback
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
