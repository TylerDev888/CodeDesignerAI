# CodeDesigner.OpenAI

Wrapper and utilities for integrating OpenAI (or other LLM) interactions used by CodeDesigner for analysis, help text generation, or other AI-assisted features.

## Purpose
- Provide an async client and higher-level helpers to query OpenAI-like APIs.
- Convert user messages to API requests and handle response parsing.

## Prerequisites
- .NET 9
- OpenAI API key or appropriate credentials (set via environment variable or configuration)

## Configuration
- Typical pattern: set an environment variable, e.g. `OPENAI_API_KEY`
- Or provide the key via your appsettings / secret management

## Example usage