#!/usr/bin/env node
/**
 * Smartsheets MCP Server — Exposed via Streamable HTTP
 *
 * Auth model: Client sends their own Smartsheet API key as Bearer token.
 * The server extracts it and creates a per-session API client.
 * No credentials are stored on the server.
 */

import { randomUUID } from 'node:crypto';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema as _zodToJsonSchema } from 'zod-to-json-schema';
import { SmartsheetClient } from './api-client.js';
import { tools } from './tools.js';

function zodToJsonSchema(schema: any): any {
  return _zodToJsonSchema(schema);
}

const PORT = parseInt(process.env.PORT || '3100', 10);
const SERVER_BASE_URL =
  process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;

const app = express();
app.use(express.json());

// --- Root route with content negotiation ---
app.get('/', (_req, res) => {
  const accept = _req.headers.accept || '';

  if (accept.includes('text/html')) {
    res.type('html').send(renderHtmlPage());
    return;
  }

  // Default: JSON
  res.json({
    name: 'Smartsheets MCP Server',
    provider: 'AgenticLedger',
    version: '1.0.0',
    description:
      'Access Smartsheet sheets, rows, columns, and workspaces through MCP tools.',
    mcpEndpoint: '/mcp',
    transport: 'streamable-http',
    tools: tools.length,
    auth: {
      type: 'bearer-passthrough',
      description:
        'Pass your Smartsheet API key as the Bearer token. No credentials are stored on this server.',
      header: 'Authorization: Bearer <your-smartsheet-api-key>',
      howToGetKey:
        'Generate an API access token at https://app.smartsheet.com/b/home → Account → Apps & Integrations → API Access',
    },
    configTemplate: {
      mcpServers: {
        smartsheets: {
          url: `${SERVER_BASE_URL}/mcp`,
          headers: {
            Authorization: 'Bearer <your-smartsheet-api-key>',
          },
        },
      },
    },
    links: {
      health: '/health',
      documentation: 'https://financemcps.agenticledger.ai/smartsheets/',
    },
  });
});

function renderHtmlPage(): string {
  const configTemplate = JSON.stringify(
    {
      mcpServers: {
        smartsheets: {
          url: `${SERVER_BASE_URL}/mcp`,
          headers: {
            Authorization: 'Bearer YOUR_API_KEY',
          },
        },
      },
    },
    null,
    2,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smartsheets MCP Server — AgenticLedger</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6}
    .header{background:#fff;border-bottom:1px solid #e2e8f0;padding:1rem 2rem;display:flex;align-items:center;gap:0.75rem}
    .header img{height:36px}
    .header span{font-weight:700;font-size:1.1rem;color:#2563EB}
    .container{max-width:720px;margin:2rem auto;padding:0 1.5rem}
    h1{font-size:1.75rem;font-weight:700;color:#0f172a;margin-bottom:0.25rem}
    .subtitle{color:#64748b;margin-bottom:2rem}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
    .card h2{font-size:1.1rem;font-weight:600;margin-bottom:0.75rem;color:#0f172a}
    .steps{padding-left:1.25rem}
    .steps li{margin-bottom:0.5rem}
    a{color:#2563EB;text-decoration:none}
    a:hover{text-decoration:underline}
    label{display:block;font-weight:500;margin-bottom:0.4rem}
    input[type="text"]{width:100%;padding:0.6rem 0.75rem;font-size:0.95rem;font-family:inherit;border:1px solid #cbd5e1;border-radius:8px;outline:none;transition:border-color .15s}
    input[type="text"]:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
    .code-block{position:relative;background:#0f172a;color:#e2e8f0;border-radius:8px;padding:1rem;font-family:'Fira Mono','Consolas',monospace;font-size:0.85rem;white-space:pre;overflow-x:auto;line-height:1.5;margin-top:0.75rem}
    .copy-btn{position:absolute;top:0.5rem;right:0.5rem;background:#2563EB;color:#fff;border:none;border-radius:6px;padding:0.35rem 0.75rem;font-size:0.8rem;font-family:inherit;cursor:pointer;transition:background .15s}
    .copy-btn:hover{background:#1d4ed8}
    .copy-btn.copied{background:#16a34a}
    .badges{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:0.5rem}
    .badge{display:flex;align-items:center;gap:0.4rem;background:#f0f9ff;border:1px solid #bae6fd;color:#0369a1;border-radius:999px;padding:0.3rem 0.85rem;font-size:0.82rem;font-weight:500}
    .badge svg{width:14px;height:14px;flex-shrink:0}
    .footer{text-align:center;color:#94a3b8;font-size:0.82rem;padding:2rem 0}
  </style>
</head>
<body>
  <div class="header">
    <img src="/static/logo.png" alt="AgenticLedger" onerror="this.style.display='none'" />
    <span>AgenticLedger</span>
  </div>

  <div class="container">
    <h1>Smartsheets MCP Server</h1>
    <p class="subtitle">Access Smartsheet sheets, rows, columns, and workspaces through MCP tools.</p>

    <div class="card">
      <h2>How to get your Smartsheet API key</h2>
      <ol class="steps">
        <li>Log in to <a href="https://app.smartsheet.com/b/home" target="_blank" rel="noopener">Smartsheet</a>.</li>
        <li>Click your <strong>Account</strong> icon (bottom-left).</li>
        <li>Go to <strong>Apps &amp; Integrations → API Access</strong>.</li>
        <li>Click <strong>Generate new access token</strong>.</li>
        <li>Copy the token and paste it below.</li>
      </ol>
    </div>

    <div class="card">
      <h2>Generate your MCP config</h2>
      <label for="apiKey">Smartsheet API Key</label>
      <input type="text" id="apiKey" placeholder="Paste your API key here…" autocomplete="off" spellcheck="false" />
      <div class="code-block" id="configBlock">${escapeHtml(configTemplate)}</div>
      <button class="copy-btn" id="copyBtn" onclick="copyConfig()">Copy</button>
    </div>

    <div class="card">
      <h2>Trust &amp; Security</h2>
      <div class="badges">
        <span class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          No credentials stored
        </span>
        <span class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Stateless &amp; per-session
        </span>
        <span class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Bearer passthrough
        </span>
      </div>
    </div>

    <div class="footer">Powered by AgenticLedger &middot; ${tools.length} tools available &middot; Streamable HTTP transport</div>
  </div>

  <script>
    const apiKeyInput = document.getElementById('apiKey');
    const configBlock = document.getElementById('configBlock');
    const baseUrl = ${JSON.stringify(SERVER_BASE_URL)};

    function buildConfig(key) {
      return JSON.stringify({
        mcpServers: {
          smartsheets: {
            url: baseUrl + '/mcp',
            headers: {
              Authorization: 'Bearer ' + (key || 'YOUR_API_KEY')
            }
          }
        }
      }, null, 2);
    }

    apiKeyInput.addEventListener('input', function () {
      configBlock.textContent = buildConfig(this.value.trim());
    });

    function copyConfig() {
      const btn = document.getElementById('copyBtn');
      navigator.clipboard.writeText(configBlock.textContent).then(function () {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'smartsheets-mcp-http',
    version: '1.0.0',
    tools: tools.length,
    transport: 'streamable-http',
    auth: 'bearer-passthrough',
  });
});

// --- Extract Bearer token from request ---
function extractBearerToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  return auth.replace(/^Bearer\s+/i, '');
}

// --- Per-session state ---
interface SessionState {
  server: Server;
  transport: StreamableHTTPServerTransport;
  client: SmartsheetClient;
}

const sessions = new Map<string, SessionState>();

function createMCPServer(client: SmartsheetClient): Server {
  const server = new Server(
    { name: 'smartsheets-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = tools.find((t) => t.name === name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      const result = await tool.handler(client, args as any);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}

// --- Streamable HTTP endpoint ---
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  // Existing session
  if (sessionId && sessions.has(sessionId)) {
    const { transport } = sessions.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — requires Bearer token
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({
      error: 'Missing Authorization header. Use: Bearer <your-smartsheet-api-key>',
    });
    return;
  }

  // Create per-session API client with the user's credentials
  const client = new SmartsheetClient(token);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  const server = createMCPServer(client);

  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) {
      sessions.delete(sid);
      console.log(`[mcp] Session closed: ${sid}`);
    }
  };

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  const newSessionId = transport.sessionId;
  if (newSessionId) {
    sessions.set(newSessionId, { server, transport, client });
    console.log(`[mcp] New session: ${newSessionId}`);
  }
});

// GET /mcp — SSE stream for server notifications
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session. Send initialization POST first.' });
    return;
  }
  const { transport } = sessions.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// DELETE /mcp — close session
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  const { transport, server } = sessions.get(sessionId)!;
  await transport.close();
  await server.close();
  sessions.delete(sessionId);
  res.status(200).json({ status: 'session closed' });
});

app.listen(PORT, () => {
  console.log(`Smartsheets MCP HTTP Server running on port ${PORT}`);
  console.log(`  MCP endpoint:   http://localhost:${PORT}/mcp`);
  console.log(`  Health check:   http://localhost:${PORT}/health`);
  console.log(`  Tools:          ${tools.length}`);
  console.log(`  Transport:      Streamable HTTP`);
  console.log(`  Auth:           Bearer passthrough (client provides Smartsheet API key)`);
});
