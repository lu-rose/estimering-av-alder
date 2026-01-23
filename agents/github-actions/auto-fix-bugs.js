import { BugFixer } from "../bug-fixer.js";
import { execSync } from "child_process";
import fs from "fs";

const CONFIG = {
  TEST_PATTERNS: ["*.test.*", "*.spec.*"],
  TEST_DIRECTORIES: ["./test", "./tests", "./__tests__", "./src/__tests__"],
  EXCLUDED_PATTERNS: [".test.", ".spec.", "node_modules"],
  STACK_TRACE_REGEX: /at \w+.*\(([^)]+\.(js|ts|tsx)):\d+:\d+\)/,
  OUTPUT_PREVIEW_LENGTH: 500,
  SKIP_TESTS: false,
};

class CIBugFixer {
  constructor() {
    this.bugFixer = new BugFixer();
  }

  async runCIFix() {
    console.log("🔍 Checking for test failures...");

    if (!this.hasTests()) {
      console.log("⚠️  No tests found - skipping test-based bug fixing");
      console.log("✅ Pipeline continues without testing");
      return;
    }

    const testResult = this.runTests();

    if (testResult.passed) {
      console.log("✅ All tests passing - no fixes needed");
      return;
    }

    await this.handleTestFailures(testResult.output);
  }

  async handleTestFailures(testOutput) {
    console.log("❌ Tests failed - attempting auto-fix...");

    const failure = this.parseTestOutput(testOutput);

    if (!failure) {
      this.exitWithError(
        "Could not parse test failures - no source file found",
        "This might be a test-only issue or configuration problem"
      );
    }

    console.log(`Found test failure(s)`);
    console.log(`🔧 Trying to auto-fix issues in ${failure.file}...`);
    console.log(`📝 Error context:\n${failure.error}`);

    const result = await this.bugFixer.fixBug(
      failure.file,
      failure.error,
      CONFIG.SKIP_TESTS
    );

    if (result.success) {
      console.log(`✅ Successfully auto-fixed ${failure.file}`);
      this.commitFixes();
      console.log("✅ Tests now passing - fix committed");
    } else {
      this.exitWithError(
        `Could not auto-fix ${failure.file}`,
        "Manual review and fixes required"
      );
    }
  }

  exitWithError(mainMessage, additionalInfo) {
    console.log(`❌ ${mainMessage}`);
    if (additionalInfo) {
      console.log(`ℹ️  ${additionalInfo}`);
    }
    console.log("❌ Manual review and fixes required");
    process.exit(1);
  }

  runTests() {
    try {
      execSync("npm test", { stdio: "pipe" });
      return { passed: true, output: "" };
    } catch (error) {
      const output =
        (error.stdout?.toString() || "") + (error.stderr?.toString() || "");
      return { passed: false, output };
    }
  }

  hasTests() {
    return (
      this.hasTestScript() && (this.hasTestDirectories() || this.hasTestFiles())
    );
  }

  hasTestScript() {
    try {
      const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
      if (!packageJson.scripts?.test) {
        console.log("ℹ️  No 'test' script found in package.json");
        return false;
      }
      return true;
    } catch (error) {
      console.log("⚠️  Could not read package.json");
      return false;
    }
  }

  hasTestDirectories() {
    return CONFIG.TEST_DIRECTORIES.some((path) => fs.existsSync(path));
  }

  hasTestFiles() {
    try {
      const patterns = CONFIG.TEST_PATTERNS.map((p) => `-name '${p}'`).join(
        " -o "
      );
      const result = execSync(`find . ${patterns} | head -1`, {
        stdio: "pipe",
        encoding: "utf8",
      });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  parseTestOutput(output) {
    const outputText = output.toString();

    console.log(
      `📋 Test output preview (first ${CONFIG.OUTPUT_PREVIEW_LENGTH} chars):`
    );
    console.log(outputText.substring(0, CONFIG.OUTPUT_PREVIEW_LENGTH));
    console.log("...\n");

    const sourceFile = this.extractSourceFileFromStackTrace(outputText);

    if (!sourceFile) {
      return null;
    }

    console.log(`📍 Identified source file: ${sourceFile}`);

    return {
      file: sourceFile,
      error: `Jest test failures:\n\n${outputText}`,
    };
  }

  extractSourceFileFromStackTrace(output) {
    const stackMatch = output.match(CONFIG.STACK_TRACE_REGEX);

    if (!stackMatch) {
      console.log("⚠️  No stack trace found in test output");
      return null;
    }

    const filePath = stackMatch[1];

    if (this.isExcludedFile(filePath)) {
      console.log(
        `⚠️  Stack trace only points to test/dependency files: ${filePath}`
      );
      console.log(
        "ℹ️  This might be a test-specific issue, not a source code bug"
      );
      return null;
    }

    return this.normalizeFilePath(filePath);
  }

  isExcludedFile(filePath) {
    return CONFIG.EXCLUDED_PATTERNS.some((pattern) =>
      filePath.includes(pattern)
    );
  }

  normalizeFilePath(filePath) {
    let normalized = filePath;

    if (normalized.startsWith("./")) {
      normalized = normalized.substring(2);
    }

    return `agents/${normalized}`;
  }

  commitFixes() {
    try {
      const status = execSync("git status --porcelain", { encoding: "utf8" });

      if (!status.trim()) {
        console.log("ℹ️  No changes to commit");
        return;
      }

      execSync("git add .", { stdio: "pipe" });
      execSync('git commit -m "🤖 Auto-fix: Resolve test failures"', {
        stdio: "pipe",
      });

      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf8",
      }).trim();

      execSync(`git push origin ${branch}`, { stdio: "pipe" });
      console.log(`✅ Fixes committed and pushed to ${branch}`);
    } catch (error) {
      console.log("❌ Failed to commit fixes:", error.message);
      process.exit(1);
    }
  }
}

const fixer = new CIBugFixer();

fixer.runCIFix().catch((error) => {
  console.error("❌ Auto-fix failed with error:", error.message);
  console.error("Stack trace:", error.stack);
  process.exit(1);
});
