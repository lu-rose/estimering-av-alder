/**
 * Simple .env file loader - replaces dotenv package
 * Loads environment variables from .env file into process.env
 */
import fs from "fs";
import path from "path";

export function loadEnv(envPath = ".env") {
  try {
    // Resolve path relative to project root
    const rootDir = path.resolve(process.cwd());
    const fullPath = path.join(rootDir, envPath);

    // Check if .env file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: ${envPath} file not found at ${fullPath}`);
      return;
    }

    // Read and parse .env file
    const envContent = fs.readFileSync(fullPath, "utf8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Parse KEY=VALUE format
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // Only set if not already defined (don't override existing env vars)
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.error(`Error loading .env file: ${error.message}`);
  }
}

// Auto-load if imported with /config suffix (mimics dotenv/config behavior)
if (import.meta.url.endsWith("/config.js")) {
  loadEnv();
}
