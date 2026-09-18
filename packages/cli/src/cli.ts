import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import YAML from 'yaml';
import { generateStarterConfig, loadConfig } from './loader.js';
import { startProxyServer } from './server.js';
import { getActiveRuntimeInfo } from './runtime.js';

const program = new Command();

program
  .name('back-overrides')
  .description('Selective endpoint interceptor and localhost redirector with automated CORS')
  .version('0.1.0')
  .option('-r, --remote <url>', 'Remote base API URL (e.g. https://api.example.com)')
  .option('-l, --local <url>', 'Local base target URL (default: http://localhost:3000)')
  .option('-p, --port <port>', 'Port on which the proxy will listen (default: 8888 or next available)')
  .option('--no-auto-port', 'Disable automatic port fallback if port is in use')
  .option('-c, --config <file>', 'Path to custom config file (JSON or YAML)')
  .option('-o, --override <rules...>', 'Selective override rules (e.g. "POST /v1/users")')
  .option('--no-cors', 'Disable automated CORS injection and preflight handling')
  .option('-v, --verbose', 'Enable verbose log output')
  .action(async (options) => {
    try {
      const config = loadConfig(options);
      await startProxyServer(config);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(pc.red(`\n❌ Error starting BackOverrides proxy: ${error.message}\n`));
      process.exit(1);
    }
  });

program
  .command('init [filename]')
  .description('Generate a starter back-overrides.json or back-overrides.yaml configuration file')
  .action((filename = 'back-overrides.json') => {
    try {
      const targetPath = path.resolve(process.cwd(), filename);
      if (fs.existsSync(targetPath)) {
        console.error(pc.yellow(`⚠️  File ${filename} already exists in current directory.`));
        return;
      }

      const starter = generateStarterConfig();
      const isYaml = filename.endsWith('.yaml') || filename.endsWith('.yml');
      const content = isYaml ? YAML.stringify(starter) : JSON.stringify(starter, null, 2);

      fs.writeFileSync(targetPath, content, 'utf-8');
      console.log(pc.green(`✅ Created starter configuration: ${pc.bold(filename)}`));
      console.log(pc.dim('You can now run: ') + pc.cyan('back-overrides'));
    } catch (err: unknown) {
      const error = err as Error;
      console.error(pc.red(`❌ Error creating config: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('Display loaded rules and configuration without starting the proxy')
  .option('-r, --remote <url>', 'Remote base API URL (e.g. https://api.example.com)')
  .option('-l, --local <url>', 'Local base target URL (default: http://localhost:3000)')
  .option('-p, --port <port>', 'Port on which the proxy will listen (default: 8888)')
  .option('-c, --config <file>', 'Path to custom config file')
  .option('-o, --override <rules...>', 'Selective override rules (e.g. "POST /v1/users")')
  .action((options, cmd) => {
    try {
      const merged = { ...cmd.parent?.opts(), ...options };
      const config = loadConfig(merged);
      console.log(pc.bold(pc.cyan('\n📋 BackOverrides Configuration Overview')));
      console.log(pc.dim('----------------------------------------------------'));
      console.log(`  ${pc.bold('Port:')}        ${config.port}`);
      console.log(`  ${pc.bold('Remote:')}      ${config.remote}`);
      console.log(`  ${pc.bold('Local:')}       ${config.local}`);
      console.log(`  ${pc.bold('CORS:')}        ${config.cors?.enabled !== false ? 'Enabled' : 'Disabled'}`);
      console.log(pc.bold('\n  Override Rules:'));

      if (!config.overrides || config.overrides.length === 0) {
        console.log(pc.dim('    (No override rules configured)'));
      } else {
        config.overrides.forEach((rule, idx) => {
          const methods = (rule.methods || ['*']).join(', ');
          const target = rule.target ? ` -> ${rule.target}` : ` -> ${config.local}${rule.path}`;
          const status = rule.disabled ? pc.red('[DISABLED]') : pc.green('[ACTIVE]');
          console.log(`    ${status} ${idx + 1}. [${pc.yellow(methods)}] ${pc.bold(rule.path)}${pc.cyan(target)}`);
          if (rule.description) {
            console.log(pc.dim(`       Note: ${rule.description}`));
          }
        });
      }
      console.log();
    } catch (err: unknown) {
      const error = err as Error;
      console.error(pc.red(`❌ Error loading config: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('snippet')
  .description('Print client-side injection snippets for your frontend or browser DevTools')
  .option('-p, --port <port>', 'Proxy port (detected automatically from running proxy if omitted)')
  .action((options) => {
    const activeRuntime = getActiveRuntimeInfo();
    const port = options.port || (activeRuntime ? String(activeRuntime.port) : '8888');
    const clientUrl = `http://localhost:${port}/__back-overrides/client.js`;

    console.log(pc.bold(pc.cyan('\n⚡ BackOverrides - Frontend Injection Snippets')));
    if (activeRuntime && !options.port) {
      console.log(pc.dim(`(Detected active BackOverrides proxy running on port ${pc.bold(port)})`));
    }
    console.log(pc.dim('Use one of the options below to activate BackOverrides without changing remote URLs in your frontend code:\n'));

    console.log(pc.bold(pc.green('1. DevTools Console (Instant - No project code changes)')));
    console.log(pc.dim('   Paste this into the browser Console on your frontend tab:'));
    console.log(`   ${pc.yellow(`fetch('${clientUrl}').then(r=>r.text()).then(eval)`)}\n`);

    console.log(pc.bold(pc.green('2. In index.html (Before your app scripts)')));
    console.log(`   ${pc.yellow(`<script src="${clientUrl}"></script>`)}\n`);

    console.log(pc.bold(pc.green('3. In TypeScript / React / Vue / Vite project:')));
    console.log(pc.dim('   In your main.ts / index.ts:'));
    console.log(`   ${pc.yellow(`import { setupBackOverrides } from '@back-overrides/client';`)}`);
    console.log(`   ${pc.yellow(`setupBackOverrides({ cliUrl: 'http://localhost:${port}' });`)}\n`);
  });

program.parse(process.argv);
