import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createBackOverridesMcpServer } from './server.js';

export * from './server.js';
export * from './tools/status.js';
export * from './tools/lifecycle.js';
export * from './tools/rules.js';
export * from './tools/test-route.js';
export * from './tools/extension.js';
export * from './tools/snippets.js';
export * from './tools/configure.js';
export * from './browser-launcher.js';
export * from './utils/paths.js';

export async function runMcpServer(): Promise<void> {
  const server = createBackOverridesMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Auto-run if executed directly as entrypoint
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith('dist/index.js') ||
    process.argv[1].endsWith('src/index.ts') ||
    process.argv[1].includes('back-overrides-mcp'));

if (isMainModule) {
  runMcpServer().catch((err) => {
    // Avoid writing non-JSON-RPC to stdout when in stdio mode; write errors to stderr
    process.stderr.write(`Fatal error running BackOverrides MCP server: ${err?.stack || err}\n`);
    process.exit(1);
  });
}
