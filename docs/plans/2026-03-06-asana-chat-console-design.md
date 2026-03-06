# Asana Chat Console for UFilms

## Problem
Magui needs a natural language interface to query editor work from Asana — primarily "what did [editor] do in [time period]?"

## Users
- **Magui** — single user, accounting/production tracking
- **Editors tracked:** Daniel, Martina, Santiago, Pablo, Gustavo, Emiliano

## Primary Use Case
Query work journals/tasks completed by editors in a given time period. Example: "Que hizo Daniel en sus jornadas de Febrero?"

## Architecture

```
Magui (browser) -> Next.js Chat UI (Spanish) -> API Route -> Vercel AI SDK (Gemini) -> @ai-sdk/mcp -> Asana MCP Server
```

### Stack
- **Frontend:** Next.js App Router, chat interface in Spanish
- **LLM:** Google Gemini 3 Flash Preview — fallback to Gemini 2.5 Pro if unstable
- **AI layer:** Vercel AI SDK (`ai` + `@ai-sdk/google` + `@ai-sdk/mcp`)
- **MCP:** `@ai-sdk/mcp` bridges Asana MCP tools into AI SDK tool definitions
- **Asana MCP server:** `https://mcp.asana.com/v2/mcp` (Streamable HTTP, OAuth 2.0)
- **Chat persistence:** SQLite (local file) or JSON files for chat history
- **Language:** Spanish (system prompt + UI)
- **Auth:** None (single user, private network)
- **Deploy:** Local `next dev` or self-hosted

### Data Flow
1. Magui types message in Spanish (e.g. "Que hizo Martina en Febrero?")
2. Next.js API route receives message + chat history
3. AI SDK sends to Gemini with system prompt (Spanish, editor context) + MCP tools
4. Gemini calls Asana tools (search tasks by assignee + date range)
5. AI SDK executes via MCP client -> Asana
6. Results fed back to Gemini
7. Gemini summarizes work in Spanish, streamed to UI

### Key Design Decisions

**Tool curation — read-focused subset**
Primary tools needed: task search/query, project listing, user lookup. Write tools (create/update/delete) available but with confirmation step.

**System prompt includes editor roster**
Maps names to Asana user IDs so Gemini can resolve "Daniel" -> correct assignee filter.

**Chat history persistence**
SQLite via `better-sqlite3` — simple, no external DB, file-based. Stores conversations so Magui can reference previous queries.

**Spanish-first**
System prompt instructs Gemini to respond in Spanish. UI labels/placeholders in Spanish.

**Tool name sanitization**
Gemini requires alphanumeric + underscore only. Sanitize MCP tool names automatically.

**OAuth token management**
Tokens expire hourly. Server-side refresh flow, stored in memory.

### Environment Variables
```
ASANA_CLIENT_ID=xxx
ASANA_CLIENT_SECRET=xxx
GOOGLE_GENERATIVE_AI_API_KEY=xxx
```

### Project Structure
```
/app
  /page.tsx                — chat UI (Spanish)
  /api/chat/route.ts       — AI SDK streaming endpoint
  /api/history/route.ts    — chat history CRUD
/lib
  /mcp.ts                  — MCP client setup + tool filtering
  /auth.ts                 — Asana OAuth token management
  /db.ts                   — SQLite chat persistence
  /system-prompt.ts        — Spanish system prompt + editor config
/data
  /chat.db                 — SQLite database (gitignored)
```

### System Prompt (draft)
```
Sos un asistente de produccion para UFilms. Respondé siempre en español.

Editores del equipo:
- Daniel
- Martina
- Santiago
- Pablo
- Gustavo
- Emiliano

Cuando te pregunten que hizo un editor, buscá sus tareas completadas en el periodo indicado y hacé un resumen claro.
```

## Resolved Questions
1. **Primary use case:** Query editor work by time period (read-heavy)
2. **API key:** Google AI Studio free tier (user will generate)
3. **Chat history:** Persisted in SQLite
4. **Language:** Spanish
