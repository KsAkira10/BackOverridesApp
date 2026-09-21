import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getBackOverridesStatus } from './tools/status.js';
import {
  startBackOverridesServer,
  stopBackOverridesServer,
  restartBackOverridesServer,
} from './tools/lifecycle.js';
import { listRules, addRule, toggleRule } from './tools/rules.js';
import { testRoute } from './tools/test-route.js';
import { getExtensionInfo, launchBrowser } from './tools/extension.js';
import { getSnippets } from './tools/snippets.js';
import { configureMcp } from './tools/configure.js';
import { getProjectPaths } from './utils/paths.js';

export function createBackOverridesMcpServer(): McpServer {
  const server = new McpServer({
    name: 'back-overrides-mcp',
    version: '0.4.1',
  });

  // ==========================================
  // TOOLS
  // ==========================================

  // 1. back_overrides_status
  server.tool(
    'back_overrides_status',
    'Check if the BackOverrides proxy server is running, active port, PID, uptime, active remote base, and rules count.',
    {},
    async () => {
      try {
        const result = await getBackOverridesStatus();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error checking status: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 2. back_overrides_start
  server.tool(
    'back_overrides_start',
    'Starts the BackOverrides proxy server in the background if it is not already running.',
    {
      configPath: z
        .string()
        .optional()
        .describe('Optional path to configuration file (defaults to back-overrides.json)'),
      port: z
        .number()
        .optional()
        .describe('Optional custom port to listen on (default: 8888 or next available)'),
      remote: z
        .string()
        .optional()
        .describe('Optional remote base API URL (e.g. https://api.example.com)'),
      local: z
        .string()
        .optional()
        .describe('Optional local base target URL (e.g. http://localhost:3000)'),
    },
    async (args) => {
      try {
        const result = await startBackOverridesServer(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error starting server: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 3. back_overrides_stop
  server.tool(
    'back_overrides_stop',
    'Stops the running BackOverrides proxy server gracefully.',
    {},
    async () => {
      try {
        const result = await stopBackOverridesServer();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error stopping server: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 4. back_overrides_restart
  server.tool(
    'back_overrides_restart',
    'Restarts the running BackOverrides proxy server with latest configuration.',
    {
      configPath: z
        .string()
        .optional()
        .describe('Optional custom config file path'),
    },
    async (args) => {
      try {
        const result = await restartBackOverridesServer(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error restarting server: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 5. back_overrides_list_rules
  server.tool(
    'back_overrides_list_rules',
    'Lists all configured override rules, their methods, target destination, description, and whether they are active or disabled.',
    {
      configPath: z
        .string()
        .optional()
        .describe('Optional custom config file path'),
    },
    async (args) => {
      try {
        const result = await listRules(args.configPath);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error listing rules: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 6. back_overrides_add_rule
  server.tool(
    'back_overrides_add_rule',
    'Adds or updates an endpoint override rule in back-overrides.json.',
    {
      path: z
        .string()
        .describe('URL path to intercept and override (e.g. /bff/v1/users/* or /api/v1/auth/login)'),
      methods: z
        .array(z.string())
        .optional()
        .describe('HTTP methods to intercept, e.g. ["*"] or ["GET", "POST"]. Defaults to ["*"]'),
      target: z
        .string()
        .optional()
        .describe('Optional custom target URL. If omitted, routes to <local><path>'),
      description: z
        .string()
        .optional()
        .describe('Human-readable description / reason for the override rule'),
      disabled: z
        .boolean()
        .optional()
        .describe('Set to true to add the rule in disabled state'),
      prepend: z
        .boolean()
        .optional()
        .describe('Set to true to place this rule at the beginning (highest priority)'),
      configPath: z
        .string()
        .optional()
        .describe('Optional custom config file path'),
    },
    async (args) => {
      try {
        const result = await addRule(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error adding rule: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 7. back_overrides_toggle_rule
  server.tool(
    'back_overrides_toggle_rule',
    'Enables or disables an existing override rule by index (e.g. "0") or path pattern without deleting it.',
    {
      pathOrIndex: z
        .string()
        .describe('Rule index number (e.g. "0") or path substring/pattern'),
      disabled: z
        .boolean()
        .optional()
        .describe('Explicit disabled boolean state. If omitted, toggles current state.'),
      configPath: z
        .string()
        .optional()
        .describe('Optional custom config file path'),
    },
    async (args) => {
      try {
        const result = await toggleRule(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error toggling rule: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 8. back_overrides_test_route
  server.tool(
    'back_overrides_test_route',
    'Simulates how BackOverrides handles a given HTTP request URL and method (matches rule, resolves target URL, checks CORS).',
    {
      url: z
        .string()
        .describe('Request URL or path to test (e.g. https://api.corp.com/bff/v1/login or /bff/v1/users)'),
      method: z
        .string()
        .optional()
        .describe('HTTP method (default: GET)'),
      origin: z
        .string()
        .optional()
        .describe('Client origin for CORS simulation (default: http://localhost:3000)'),
      configPath: z
        .string()
        .optional()
        .describe('Optional custom config file path'),
    },
    async (args) => {
      try {
        const result = await testRoute(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error testing route: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 9. back_overrides_extension_info
  server.tool(
    'back_overrides_extension_info',
    'Returns Chrome/Brave/Edge extension directory, manifest details, and step-by-step setup instructions.',
    {},
    async () => {
      try {
        const result = await getExtensionInfo();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error getting extension info: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 10. back_overrides_launch_browser
  server.tool(
    'back_overrides_launch_browser',
    'Launches Google Chrome (or Brave/Edge/Chromium) with the BackOverrides extension preloaded via --load-extension.',
    {
      url: z
        .string()
        .optional()
        .describe('Target URL to open in the browser (e.g. http://localhost:8080 or frontend URL)'),
      browser: z
        .enum(['chrome', 'brave', 'edge', 'chromium'])
        .optional()
        .describe('Browser to launch (default: chrome)'),
      isolatedProfile: z
        .boolean()
        .optional()
        .describe('Whether to use a temporary isolated browser profile'),
    },
    async (args) => {
      try {
        const result = await launchBrowser(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error launching browser: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 11. back_overrides_get_snippets
  server.tool(
    'back_overrides_get_snippets',
    'Returns frontend injection snippets (DevTools console one-liner, script tag, or npm import) when not using extension.',
    {
      port: z
        .number()
        .optional()
        .describe('Custom port for the snippets (defaults to running proxy port or 8888)'),
    },
    async (args) => {
      try {
        const result = await getSnippets(args.port);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error generating snippets: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // 12. back_overrides_configure_mcp
  server.tool(
    'back_overrides_configure_mcp',
    'Configures or updates .vscode/mcp.json for GitHub Copilot in VS Code and provides configs for Claude and Cursor.',
    {},
    async () => {
      try {
        const result = await configureMcp();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error configuring MCP: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ==========================================
  // RESOURCES
  // ==========================================

  server.resource('status', 'back-overrides://status', async (uri) => {
    const status = await getBackOverridesStatus();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(status, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.resource('config', 'back-overrides://config', async (uri) => {
    const paths = getProjectPaths();
    const configContent = fs.existsSync(paths.defaultConfigFile)
      ? fs.readFileSync(paths.defaultConfigFile, 'utf-8')
      : '{}';
    return {
      contents: [
        {
          uri: uri.href,
          text: configContent,
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.resource('extension', 'back-overrides://extension', async (uri) => {
    const info = await getExtensionInfo();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(info, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.resource('snippets', 'back-overrides://snippets', async (uri) => {
    const snippets = await getSnippets();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(snippets, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  });

  // ==========================================
  // PROMPTS
  // ==========================================

  server.prompt(
    'diagnose-interception',
    'Diagnose why a particular request is failing or not being intercepted by BackOverrides',
    {
      url: z.string().describe('The URL that is experiencing issues'),
      method: z.string().optional().describe('The HTTP method (e.g. GET, POST)'),
    },
    ({ url, method }) => {
      const httpMethod = method || 'GET';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please diagnose network interception for request: [${httpMethod} ${url}].
Follow these steps:
1. Run \`back_overrides_status\` to confirm if the BackOverrides proxy is active and which port it is listening on.
2. Run \`back_overrides_test_route\` with url="${url}" and method="${httpMethod}" to evaluate if the route matches any active rules.
3. If it matches, check if the local service is running on the target port and if CORS headers are being properly handled.
4. If it does not match, inspect the rules with \`back_overrides_list_rules\` and propose adding or adjusting a rule using \`back_overrides_add_rule\`.
5. Check if the browser extension is loaded using \`back_overrides_extension_info\` or offer to open the browser using \`back_overrides_launch_browser\`.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    'setup-browser-extension',
    'Step-by-step guide to load and test the BackOverrides Chrome extension',
    {
      targetUrl: z.string().optional().describe('Frontend application URL to test'),
    },
    ({ targetUrl }) => {
      const appUrl = targetUrl || 'http://localhost:3000';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Guide the user through activating the BackOverrides Chrome extension for testing frontend application at ${appUrl}:
1. Run \`back_overrides_status\` to ensure the proxy is running. If not, start it with \`back_overrides_start\`.
2. Run \`back_overrides_extension_info\` to retrieve the exact folder path and manifest info.
3. Suggest launching the browser directly with \`back_overrides_launch_browser\` pointing to "${appUrl}".
4. Explain that the extension automatically intercepts both fetch/XHR and full-page main_frame navigations (such as OAuth login redirects) with zero frontend code changes.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    'configure-oauth-bff',
    'Configure BackOverrides rules for full-page OAuth login redirect and local BFF development',
    {
      remoteOAuthPath: z
        .string()
        .describe('Remote OAuth endpoint path, e.g. /bff/v1/oauth2/* or /auth/*'),
      localBffUrl: z
        .string()
        .describe('Local BFF URL, e.g. http://localhost:8080'),
    },
    ({ remoteOAuthPath, localBffUrl }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Configure BackOverrides to intercept OAuth2 login and redirect it to local BFF:
1. Check current rules using \`back_overrides_list_rules\`.
2. Add an override rule using \`back_overrides_add_rule\` with path="${remoteOAuthPath}", methods=["*"], and description="Redirect OAuth flow to local BFF".
3. Verify the match using \`back_overrides_test_route\` with a sample authorize URL.
4. Explain how the Chrome extension intercepts \`window.location.href = .../authorize\` navigations (main_frame) and routes them to ${localBffUrl} seamlessly.`,
            },
          },
        ],
      };
    }
  );

  return server;
}
