# AME Pro AI Workstation — Model Selector + Claude Code Capabilities

## Overview
Two major enhancements to the AME Pro AI Workstation desktop app:
1. **Model Version Selector** — Users pick specific model versions (Opus 4.6, Sonnet 4.6, GPT-5.3, etc.) instead of just providers
2. **Claude Code Capabilities** — Terminal execution, executable code blocks, file operations

---

## Phase 1: Complete Pending Workflow Wiring
Wire WorkflowIndicator into ChatInterface (capture `response.workflow`, render indicator).

**Files:** `src/components/ai/ChatInterface.jsx`

---

## Phase 2: Model Version Selector

### 2A — Update `electron/services/ai-providers.js`
Replace the old 2-model config per provider with a full model catalog:
```
claude:
  - claude-opus-4-6 (Opus 4.6) — flagship, most capable
  - claude-sonnet-4-6 (Sonnet 4.6) — fast + capable
  - claude-haiku-4-5-20251001 (Haiku 4.5) — fastest, cheapest

openai:
  - gpt-4.1 (GPT-4.1) — flagship
  - gpt-4.1-mini (GPT-4.1 Mini) — budget
  - o3 (o3 Reasoning) — reasoning model
  - o4-mini (o4-mini) — fast reasoning

deepseek:
  - deepseek-chat (DeepSeek V3) — general
  - deepseek-reasoner (DeepSeek R1) — reasoning

kimi:
  - moonshot-v1-8k (Kimi 8K) — standard
  - moonshot-v1-128k (Kimi 128K) — long context
```

Each model entry: `{ id, label, tier, contextWindow }` where tier is "flagship"|"fast"|"budget"|"reasoning"

### 2B — Update `electron/services/ai-gateway.js`
Add the new models to `COST_PER_MILLION_TOKENS_ZAR` map.

### 2C — Update `src/contexts/AIProviderContext.jsx`
Add `selectedModel` + `setSelectedModel` state. Persist selected model to settings.

### 2D — Rebuild `src/components/ai/ProviderSelector.jsx` as `ModelSelector`
Replace the simple provider dropdown with a grouped model picker:
- Grouped by provider (Anthropic, OpenAI, DeepSeek, Kimi)
- Shows model name, tier badge, health dot
- Only shows providers with configured API keys
- Persists selection

### 2E — Wire model through `electron/preload.js` → `ai-handlers.js`
- Add `model` field to `sendToAI` payload
- Pass `model` through to `ai-gateway.sendRequest` via `options.model`
- Show used model in MessageBubble provider badge

### 2F — Update `src/components/ai/MessageBubble.jsx`
Show the actual model name (e.g. "Opus 4.6") instead of just provider name.

---

## Phase 3: Claude Code Capabilities

### 3A — Terminal Service: `electron/services/terminal-service.js`
Uses Node.js built-in `child_process.spawn()` to execute commands:
- `execute(command, cwd, timeout)` — run command, capture stdout/stderr
- `kill(pid)` — terminate running process
- Session tracking with active process map
- Timeout enforcement (default 30s, max 120s)
- Working directory defaults to user's home

### 3B — Terminal IPC Handlers: `electron/ipc/terminal-handlers.js`
IPC endpoints:
- `terminal:execute` — run a command, return { stdout, stderr, exitCode }
- `terminal:kill` — kill running process
- Audit trail logging for all executions

### 3C — Update `electron/preload.js`
Expose:
- `executeCommand(command, cwd, timeout)`
- `killProcess(pid)`

### 3D — Update `electron/main.js`
Import and register terminal handlers.

### 3E — Executable Code Blocks in `MarkdownRenderer.jsx`
Add "Run" button next to "Copy" on code blocks:
- Detect language (python, javascript, bash, powershell, etc.)
- Click "Run" → calls `window.api.executeCommand()`
- Shows output panel below code block (stdout in green, stderr in red)
- Shows execution status (running spinner, exit code)
- Only for supported languages: js/node, python, bash/sh/powershell

### 3F — Update `src/components/ai/ChatInterface.jsx`
Add model to sendToAI payload from context.

---

## Phase 4: Build & Verify
- Run `npx electron-vite build`
- Preview and screenshot verification

---

## File Change Summary

| File | Action |
|------|--------|
| `src/components/ai/ChatInterface.jsx` | Wire workflow + model selection |
| `electron/services/ai-providers.js` | Full model catalog |
| `electron/services/ai-gateway.js` | New model costs |
| `src/contexts/AIProviderContext.jsx` | Add selectedModel state |
| `src/components/ai/ProviderSelector.jsx` | Rebuild as ModelSelector |
| `src/components/ai/MessageBubble.jsx` | Show model name |
| `electron/preload.js` | Add model to sendToAI + terminal methods |
| `electron/ipc/ai-handlers.js` | Accept model param |
| `electron/services/terminal-service.js` | NEW — command execution |
| `electron/ipc/terminal-handlers.js` | NEW — terminal IPC |
| `electron/main.js` | Register terminal handlers |
| `src/components/ai/MarkdownRenderer.jsx` | Add Run button to code blocks |
