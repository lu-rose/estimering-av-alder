// From AIDD Course module 3: Adding GitHub Actions Automation to Your Bug Fixer

import { BugFixer } from "../bug-fixer.js";
import { execSync } from "child_process";
import fs from "fs";

class CIBugFixer extends BugFixer {
  async runCIFix() {
    console.log("🔍 Checking for test failures...");

    // Check if tests exist
    const hasTests = this.checkIfTestsExist();

    if (!hasTests) {
      console.log("⚠️  No tests found - skipping test-based bug fixing");
      console.log("✅ Pipeline continues without testing");
      return;
    }

    try {
      // Run tests to see what's failing
      execSync("npm test", { stdio: "pipe" });
      console.log("✅ All tests passing - no fixes needed");
      return;
    } catch (error) {
      // Tests failed - let's try to fix them
      const failure = this.parseTestOutput(error.stdout + error.stderr);

      if (!failure) {
        console.log("❌ Could not parse test failures - no source file found");
        return;
      }

      console.log(`Found test failure(s)`);
      console.log(`🔧 Trying to fix all issues in ${failure.file}...`);
      console.log(`📝 All error contexts:\n${failure.error}`);

      // Pass false for skipTests to verify the fix actually works
      const result = await this.fixBug(failure.file, failure.error, false);
      if (result.success) {
        console.log(`✅ Fixed ${failure.file}`);
        this.commitFixes();
      } else {
        console.log(`❌ Could not fix ${failure.file}`);
      }
    }
  }

  checkIfTestsExist() {
    try {
      // First, check if "test" script exists in package.json
      const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
      if (!packageJson.scripts || !packageJson.scripts.test) {
        console.log("ℹ️  No 'test' script found in package.json");
        return false;
      }

      // Check common test file patterns
      const commonTestPaths = [
        "./test",
        "./tests",
        "./__tests__",
        "./src/__tests__",
      ];

      for (const path of commonTestPaths) {
        if (fs.existsSync(path)) {
          return true;
        }
      }

      // Also check if any .test. or .spec. files exist
      try {
        const result = execSync(
          "find . -name '*.test.*' -o -name '*.spec.*' | head -1",
          {
            stdio: "pipe",
            encoding: "utf8",
          }
        );
        return result.trim().length > 0;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  parseTestOutput(output) {
    const outputText = output.toString();

    // 1. Find the file to fix from stack traces
    const stackMatch = outputText.match(
      /at \w+.*\(([^)]+\.(js|ts|tsx)):\d+:\d+\)/
    );

    if (
      !stackMatch ||
      stackMatch[1].includes(".test.") ||
      stackMatch[1].includes(".spec.") ||
      stackMatch[1].includes("node_modules")
    ) {
      // Could not find a valid source file in stack trace
      console.log("⚠️  Could not identify source file from test output");
      return null;
    }

    // The path from stack trace is relative to where tests run (agents/ dir)
    // We need to prepend 'agents/' since this script runs from the root
    let sourceFile = stackMatch[1];

    // Remove leading ./ if present
    if (sourceFile.startsWith("./")) {
      sourceFile = sourceFile.substring(2);
    }

    // Prepend agents/ to make it relative to root
    sourceFile = "agents/" + sourceFile;

    // 2. Pass the error info
    return {
      file: sourceFile,
      error: `Jest test failures:\n\n${outputText}`,
    };
  }

  commitFixes() {
    try {
      execSync("git add .", { stdio: "pipe" });
      execSync('git commit -m "🤖 Auto-fix: Resolve test failures"', {
        stdio: "pipe",
      });
      execSync("git push", { stdio: "pipe" });
      console.log("✅ Fixes committed and pushed");
    } catch (error) {
      console.log("❌ Failed to commit fixes");
    }
  }
}

// Run it
const fixer = new CIBugFixer();
fixer.runCIFix().catch(console.error);
