#!/bin/bash
# Generic wrapper that runs any agent with proper environment setup

if [ -z "$GROQ_API_KEY" ]; then
    echo "❌ Please provide GROQ_API_KEY which can be found in .env.development file."
    echo "Usage: export GROQ_API_KEY=your_api_key_here"
    exit 1
fi

if [ -z "$1" ]; then
    echo "❌ Please provide an agent file to run."
    echo "Usage: bash agents/run-with-env.sh <agent-file> [args...]"
    exit 1
fi

AGENT_FILE="$1"
shift  # Remove first argument, pass the rest to the agent

# Suppress SSL warnings for development
export NODE_TLS_REJECT_UNAUTHORIZED=0
export NODE_NO_WARNINGS=1
node "$(dirname "$0")/$AGENT_FILE" "$@"