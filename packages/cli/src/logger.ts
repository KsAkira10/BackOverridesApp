import pc from 'picocolors';

export interface LogRequestParams {
  method: string;
  url: string;
  isOverride: boolean;
  targetUrl: string;
  statusCode: number;
  durationMs: number;
  isPreflight?: boolean;
  responseBodyPreview?: string;
}

export class Logger {
  constructor(
    private isVerbose: boolean = false,
    private isSilent: boolean = false
  ) {}

  public setVerbose(verbose: boolean): void {
    this.isVerbose = verbose;
  }

  public setSilent(silent: boolean): void {
    this.isSilent = silent;
  }

  public banner(config: {
    port: number;
    remote: string;
    local: string;
    rulesCount: number;
    corsEnabled: boolean;
    hasAuthRules?: boolean;
  }): void {
    if (this.isSilent) return;
    console.log();
    console.log(pc.bold(pc.cyan('⚡ BackOverrides Reverse Proxy')));
    console.log(pc.dim('----------------------------------------------------'));
    console.log(`  ${pc.bold('Listening:')}      ${pc.green(`http://localhost:${config.port}`)}`);
    console.log(`  ${pc.bold('Remote API:')}     ${pc.blue(config.remote)}`);
    console.log(`  ${pc.bold('Local Target:')}   ${pc.yellow(config.local)}`);
    console.log(`  ${pc.bold('CORS Injection:')} ${config.corsEnabled ? pc.green('ENABLED (Permissive)') : pc.red('DISABLED')}`);
    console.log(`  ${pc.bold('Active Rules:')}   ${pc.magenta(`${config.rulesCount} rule(s)`)}`);
    if (config.hasAuthRules) {
      console.log(pc.dim('----------------------------------------------------'));
      console.log(pc.yellow(`  💡 Tip: OAuth/navigation routes detected.`));
      console.log(pc.dim(`     Full-page redirects (window.location) require the Chrome Extension`));
      console.log(pc.dim(`     (packages/extension) with 'main_frame' enabled.`));
    }
    console.log(pc.dim('----------------------------------------------------'));
    console.log(pc.dim('Ready to intercept requests. Press Ctrl+C to stop.\n'));
  }

  public logOAuthMismatchHint(url: string, errorDetail?: string): void {
    if (this.isSilent) return;
    const time = new Date().toLocaleTimeString();
    const tag = pc.bgYellow(pc.black(' OAUTH DIAGNOSIS '));
    console.warn(`\n${pc.dim(time)} ${tag} ${pc.yellow(pc.bold(`OAuth Token Mismatch on: ${url}`))}`);
    if (errorDetail) {
      console.warn(pc.dim(`  Detail: ${errorDetail}`));
    }
    console.warn(pc.yellow(`  ⚠️  The Identity Provider rejected the authorization code (invalid_grant).`));
    console.warn(pc.yellow(`  👉 Probable cause: Browser navigated directly to remote IdP instead of local BFF.`));
    console.warn(pc.cyan(`  💡 Fix: Load the BackOverrides Extension in Chrome (packages/extension) to intercept`));
    console.warn(pc.cyan(`     the /authorize page redirect automatically via 'main_frame' without frontend changes.\n`));
  }

  public logPreflight(method: string, url: string, origin: string | undefined): void {
    if (this.isSilent) return;
    const time = new Date().toLocaleTimeString();
    const tag = pc.bgYellow(pc.black(' PREFLIGHT '));
    const pathStr = pc.bold(url);
    const originStr = origin ? pc.dim(`(Origin: ${origin})`) : '';
    console.log(`${pc.dim(time)} ${tag} ${method} ${pathStr} -> ${pc.green('204 No Content')} ${originStr}`);
  }

  public logRequest({
    method,
    url,
    isOverride,
    targetUrl,
    statusCode,
    durationMs,
    responseBodyPreview,
  }: LogRequestParams): void {
    if (this.isSilent) return;
    const time = new Date().toLocaleTimeString();
    const tag = isOverride
      ? pc.bgCyan(pc.black(' OVERRIDE '))
      : pc.bgBlack(pc.dim(' REMOTE '));

    const methodColor = this.getMethodColor(method);
    const methodStr = methodColor(method.padEnd(7));
    const statusStr = this.getStatusColor(statusCode)(String(statusCode));
    const latencyStr = pc.dim(`(${durationMs}ms)`);

    const dest = isOverride
      ? pc.cyan(`-> ${targetUrl}`)
      : pc.dim(`-> ${targetUrl}`);

    console.log(`${pc.dim(time)} ${tag} ${methodStr} ${url} ${statusStr} ${dest} ${latencyStr}`);
    if (responseBodyPreview) {
      const truncated = responseBodyPreview.length > 200 ? `${responseBodyPreview.slice(0, 200)}...` : responseBodyPreview;
      console.log(pc.dim(`  📦 Response: `) + pc.gray(truncated));
    }
  }

  public logLocalConnectionError(targetUrl: string, error: Error & { code?: string }): void {
    if (this.isSilent) return;
    const time = new Date().toLocaleTimeString();
    const tag = pc.bgRed(pc.white(' LOCAL ERROR '));
    console.error(`\n${pc.dim(time)} ${tag} ${pc.red(pc.bold(`Failed to connect to local target: ${targetUrl}`))}`);
    if (error.code === 'ECONNREFUSED') {
      console.error(pc.yellow(`  ⚠️  ECONNREFUSED: No local service is listening on ${targetUrl}.`));
      console.error(pc.yellow(`  👉 Make sure your local server is running and the port is correct.\n`));
    } else if (error.code === 'ETIMEDOUT') {
      console.error(pc.yellow(`  ⚠️  ETIMEDOUT: Connection to ${targetUrl} timed out.\n`));
    } else {
      console.error(pc.red(`  ⚠️  ${error.message}\n`));
    }
  }

  public verbose(label: string, data: unknown): void {
    if (this.isSilent || !this.isVerbose) return;
    console.log(pc.dim(`  [VERBOSE] ${label}:`));
    if (typeof data === 'string') {
      console.log(pc.dim(`    ${data}`));
    } else {
      console.log(pc.dim(`    ${JSON.stringify(data, null, 2).replace(/\n/g, '\n    ')}`));
    }
  }

  private getMethodColor(method: string): (str: string) => string {
    switch (method.toUpperCase()) {
      case 'GET':
        return pc.green;
      case 'POST':
        return pc.yellow;
      case 'PUT':
      case 'PATCH':
        return pc.blue;
      case 'DELETE':
        return pc.red;
      default:
        return pc.magenta;
    }
  }

  private getStatusColor(status: number): (str: string) => string {
    if (status >= 200 && status < 300) return pc.green;
    if (status >= 300 && status < 400) return pc.cyan;
    if (status >= 400 && status < 500) return pc.yellow;
    return pc.red;
  }
}
