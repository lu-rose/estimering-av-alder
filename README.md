# Project: Simple code & AI agents

Estimate the age of a person based on a name and country code (optional).

**Agents**

- Code reviewer. An AI-powered tool using Groq's models to analyze code for bugs, security issues, performance concerns, and code quality.
- Bug fixer. CLI-ready debugging agent that automatically detect, diagnose, and repair code issues. If the tests fails, the code will be patched intelligently.
- Documentation writer. Reads code files and generates comprehensive docs with examples and parameter descriptions automatically.

**Backend**

Uses API from [Agify](https://agify.io/documentation) to estimate the age of a person based on a name. As naming conventions can rely on demographics, it is optional to add a country code/id. A full list of available country IDs: https://agify.io/our-data.

**Frontend**

A simple React App that shows estimated age based on a name and a country (optional). Claude Sonnet 4.5 is the designer.

## Documentation

- [agents/dummy-data/dummy-api-test.ts](docs/agents/dummy-data/dummy-api-test.md)
