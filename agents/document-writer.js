// From AIDD Course module 3: Build Your Third Strategic Agent - Documentation Writer (modified to use Groq)
import "./utils/config.js";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { AgentConfig } from "./agent-config.js";
import { PromptTemplateEngine } from "./prompt-templates.js";

class DocumentationWriter {
  constructor(options = {}) {
    this.agentConfig = new AgentConfig();
    this.settings = this.agentConfig.documentationWriter;
    this.global = this.agentConfig.global;
    this.promptSettings = this.agentConfig.prompts.documentationWriter;
    this.promptEngine = new PromptTemplateEngine();
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Model configuration
    this.model = options.model || this.settings.model || this.global.model;
    this.maxTokens =
      options.maxTokens || this.settings.maxTokens || this.global.maxTokens;

    // Check if agent is enabled
    if (!this.agentConfig.isAgentEnabled("documentationWriter")) {
      console.warn("⚠️  Documentation Writer is disabled in configuration");
    }
  }

  async generateDocs(filename) {
    console.log(`📝 Generating docs for ${filename}...`);

    const code = fs.readFileSync(filename, "utf8");
    const existingDocs = this.readExistingDocs(filename);
    const documentation = await this.analyzeCode(code, filename, existingDocs);
    this.saveDocs(filename, documentation);
  }

  getDocFilePath(filename) {
    const docFilename = filename.replace(/\.(js|ts|jsx|tsx)$/, ".md");
    return path.join("docs", docFilename);
  }

  readCode(filename) {
    return fs.readFileSync(filename, "utf8");
  }

  readExistingDocs(filename) {
    try {
      return fs.readFileSync(this.getDocFilePath(filename), "utf8");
    } catch {
      return null;
    }
  }

  async analyzeCode(code, filename, existingDocs) {
    const language = this.detectLanguage(filename);

    const variables = {
      filename,
      language,
      code,
      style: this.settings.style || "standard",
      includeExamples: this.settings.includeExamples ? "Yes" : "No",
      voiceAndTone: this.settings.voiceAndTone || "professional",
      existingDocs: existingDocs ? existingDocs.slice(0, 500) : "None",
      ...this.promptSettings.customVariables,
    };

    console.log(
      `📝 Using '${this.promptSettings.template}' template for documentation...`
    );

    const prompt = this.promptEngine.getTemplate(
      "documentationWriter",
      this.promptSettings.template,
      variables
    );

    const chatCompletion = await this.groq.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
        {
          role: "system",
          content: "You are a technical documentation expert.",
        },
      ],
      temperature: 0.1,
    });

    return chatCompletion.choices[0]?.message?.content || "";
  }

  saveDocs(filename, documentation) {
    const docsDir = path.join("docs", path.dirname(filename));
    fs.mkdirSync(docsDir, { recursive: true });

    const docFile = this.getDocFilePath(filename);
    fs.writeFileSync(docFile, documentation);

    this.updateReadmeIndex(filename);
    console.log(`✅ Created ${docFile}`);
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

  updateReadmeIndex(filename) {
    const readmePath = "README.md";
    let readme = fs.existsSync(readmePath)
      ? fs.readFileSync(readmePath, "utf8")
      : "# Project Documentation\n\n";

    const relativePath = this.getDocFilePath(filename).replace("docs/", "");
    const linkText = `- [${filename}](docs/${relativePath})`;

    if (!readme.includes("## Documentation")) {
      readme += "\n## Documentation\n\n";
    }

    if (!readme.includes(linkText)) {
      readme += `${linkText}\n`;
    }

    fs.writeFileSync(readmePath, readme);
    console.log("✅ Updated README.md index");
  }
}

// CLI - only run if file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const filename = process.argv[2];

  if (!filename || !fs.existsSync(filename)) {
    console.log("Usage: node doc-writer.js <filename>");
    process.exit(1);
  }

  const docWriter = new DocumentationWriter();
  docWriter.generateDocs(filename).catch(console.error);
}

export { DocumentationWriter };
