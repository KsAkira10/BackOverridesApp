import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  type BackOverridesConfig,
  type OverrideRule,
  normalizeConfig,
  parseRuleShorthand,
} from '@back-overrides/core';

export interface CliOptions {
  remote?: string;
  local?: string;
  port?: string | number;
  config?: string;
  override?: string[];
  cors?: boolean;
  verbose?: boolean;
}

const DEFAULT_CONFIG_FILES = [
  'back-overrides.json',
  'back-overrides.yaml',
  'back-overrides.yml',
  '.back-overrides.json',
  '.back-overrides.yaml',
  '.back-overrides.yml',
];

/**
 * Searches for a configuration file in the current working directory.
 */
export function findConfigFile(explicitPath?: string, cwd: string = process.cwd()): string | null {
  if (explicitPath) {
    const resolved = path.resolve(cwd, explicitPath);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
    throw new Error(`Configuration file not found at: ${resolved}`);
  }

  for (const filename of DEFAULT_CONFIG_FILES) {
    const candidate = path.resolve(cwd, filename);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Reads and parses a JSON or YAML configuration file.
 */
export function readConfigFile(filePath: string): Partial<BackOverridesConfig> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.yaml' || ext === '.yml') {
    return YAML.parse(content) as Partial<BackOverridesConfig>;
  }

  // Default to JSON
  return JSON.parse(content) as Partial<BackOverridesConfig>;
}

/**
 * Loads configuration by merging file configuration with CLI flags.
 */
export function loadConfig(options: CliOptions = {}, cwd: string = process.cwd()): BackOverridesConfig {
  let fileConfig: Partial<BackOverridesConfig> = {};

  const configFile = findConfigFile(options.config, cwd);
  if (configFile) {
    fileConfig = readConfigFile(configFile);
  }

  // Parse command-line override rules
  const cliOverrides: OverrideRule[] = [];
  if (options.override && Array.isArray(options.override)) {
    for (const ruleStr of options.override) {
      cliOverrides.push(parseRuleShorthand(ruleStr));
    }
  }

  // Combine overrides: CLI flags take precedence / are prepended
  const combinedOverrides = [
    ...cliOverrides,
    ...(fileConfig.overrides || []),
  ];

  const mergedConfig: Partial<BackOverridesConfig> = {
    remote: options.remote || fileConfig.remote,
    local: options.local || fileConfig.local || 'http://localhost:3000',
    port: options.port !== undefined ? Number(options.port) : fileConfig.port ?? 8080,
    cors: {
      ...fileConfig.cors,
      enabled: options.cors !== undefined ? options.cors : fileConfig.cors?.enabled ?? true,
    },
    overrides: combinedOverrides,
    verbose: options.verbose !== undefined ? options.verbose : fileConfig.verbose ?? false,
  };

  return normalizeConfig(mergedConfig);
}

/**
 * Generates a starter template configuration object.
 */
export function generateStarterConfig(): BackOverridesConfig {
  return {
    port: 8080,
    remote: 'https://api.example.com',
    local: 'http://localhost:3000',
    cors: {
      enabled: true,
      origin: true,
      credentials: true,
    },
    overrides: [
      {
        methods: ['POST', 'GET'],
        path: '/v1/users',
        description: 'Redirects /v1/users to local service on port 3000',
      },
      {
        methods: ['*'],
        path: '/v1/users/:id',
        description: 'Redirects /v1/users/:id dynamically',
      },
    ],
  };
}
