import net from 'node:net';
import { DEFAULT_PORT_SCAN_RANGE, DEFAULT_PROXY_PORT } from '@back-overrides/core';

function testBind(port: number, host?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once('error', () => {
      resolve(false);
    });

    if (host) {
      server.listen(port, host, () => {
        server.close(() => {
          resolve(true);
        });
      });
    } else {
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
    }
  });
}

/**
 * Checks if a specific TCP port is available to bind.
 * Tests both 127.0.0.1 and 0.0.0.0 to ensure conflict-free binding across OS stacks.
 */
export async function isPortAvailable(port: number, host?: string): Promise<boolean> {
  if (host) {
    return testBind(port, host);
  }

  const loopbackOk = await testBind(port, '127.0.0.1');
  if (!loopbackOk) return false;

  const anyOk = await testBind(port, '0.0.0.0');
  if (!anyOk) return false;

  return true;
}

/**
 * Finds the first available port starting from startPort up to startPort + maxAttempts.
 */
export async function findAvailablePort(
  startPort: number = DEFAULT_PROXY_PORT,
  maxAttempts: number = DEFAULT_PORT_SCAN_RANGE,
  host?: string
): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const candidate = startPort + offset;
    const available = await isPortAvailable(candidate, host);
    if (available) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find an available port in range ${startPort}-${startPort + maxAttempts - 1}.`
  );
}
