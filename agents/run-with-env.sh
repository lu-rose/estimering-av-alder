#!/bin/bash
# Simple wrapper that just handles SSL and let you know if the API key is not set

if [ -z "$GROQ_API_KEY" ]; then
    echo "❌ Please provide GROQ_API_KEY which can be found in .env.development file."
    echo "Usage: export GROQ_API_KEY=your_api_key_here"
    exit 1
fi

# Suppress SSL warnings for development
export NODE_TLS_REJECT_UNAUTHORIZED=0
export NODE_NO_WARNINGS=1
node "$(dirname "$0")/code-reviewer.js" "$@"