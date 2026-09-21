import fs from 'node:fs';
import path from 'node:path';
import type { BackOverridesConfig, HttpMethod, OverrideRule } from '@back-overrides/core';
import { getProjectPaths } from '../utils/paths.js';

export interface ListRulesResult {
  configFile: string;
  remote: string;
  local: string;
  port?: number;
  corsEnabled: boolean;
  totalCount: number;
  activeCount: number;
  disabledCount: number;
  rules: Array<OverrideRule & { index: number; resolvedTarget: string }>;
}

export interface AddRuleOptions {
  path: string;
  methods?: string[];
  target?: string;
  description?: string;
  disabled?: boolean;
  prepend?: boolean;
  configPath?: string;
  cwd?: string;
}

export interface ToggleRuleOptions {
  pathOrIndex: string | number;
  disabled?: boolean;
  configPath?: string;
  cwd?: string;
}

function resolveConfigFile(customPath?: string, cwd?: string): string {
  if (customPath) {
    const resolved = path.resolve(cwd || process.cwd(), customPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Specified config file not found: ${resolved}`);
    }
    return resolved;
  }
  const paths = getProjectPaths(cwd);
  if (fs.existsSync(paths.defaultConfigFile)) {
    return paths.defaultConfigFile;
  }
  throw new Error(`Configuration file back-overrides.json not found in ${paths.repoRoot}`);
}

function readConfig(filePath: string): BackOverridesConfig {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as BackOverridesConfig;
}

function writeConfig(filePath: string, config: BackOverridesConfig): void {
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Lists all configured rules in BackOverrides.
 */
export async function listRules(configPath?: string, cwd?: string): Promise<ListRulesResult> {
  const file = resolveConfigFile(configPath, cwd);
  const config = readConfig(file);
  const rules = config.overrides || [];

  let activeCount = 0;
  let disabledCount = 0;

  const decoratedRules = rules.map((r, index) => {
    if (r.disabled) {
      disabledCount++;
    } else {
      activeCount++;
    }
    const resolvedTarget = r.target || `${config.local || 'http://localhost:3000'}${r.path}`;
    return {
      ...r,
      index,
      resolvedTarget,
    };
  });

  return {
    configFile: file,
    remote: config.remote,
    local: config.local || 'http://localhost:3000',
    port: config.port,
    corsEnabled: config.cors?.enabled !== false,
    totalCount: rules.length,
    activeCount,
    disabledCount,
    rules: decoratedRules,
  };
}

/**
 * Adds or updates a rule in back-overrides.json.
 */
export async function addRule(options: AddRuleOptions): Promise<{
  success: boolean;
  message: string;
  rule: OverrideRule;
  totalCount: number;
  configFile: string;
}> {
  const file = resolveConfigFile(options.configPath, options.cwd);
  const config = readConfig(file);

  if (!Array.isArray(config.overrides)) {
    config.overrides = [];
  }

  const newRule: OverrideRule = {
    path: options.path,
    methods:
      options.methods && options.methods.length > 0
        ? (options.methods.map((m) => m.toUpperCase()) as HttpMethod[])
        : ['*'],
  };

  if (options.target) newRule.target = options.target;
  if (options.description) newRule.description = options.description;
  if (options.disabled !== undefined) newRule.disabled = options.disabled;

  // Check if identical path exists
  const existingIdx = config.overrides.findIndex(
    (r) => r.path.toLowerCase() === options.path.toLowerCase()
  );

  let message = '';
  if (existingIdx >= 0) {
    config.overrides[existingIdx] = {
      ...config.overrides[existingIdx],
      ...newRule,
    };
    message = `Updated existing rule for path "${options.path}" at index ${existingIdx}.`;
  } else if (options.prepend) {
    config.overrides.unshift(newRule);
    message = `Prepended new rule for path "${options.path}" as first rule (highest priority).`;
  } else {
    config.overrides.push(newRule);
    message = `Appended new rule for path "${options.path}".`;
  }

  writeConfig(file, config);

  return {
    success: true,
    message,
    rule: newRule,
    totalCount: config.overrides.length,
    configFile: file,
  };
}

/**
 * Toggles or sets the disabled state of a rule.
 */
export async function toggleRule(options: ToggleRuleOptions): Promise<{
  success: boolean;
  message: string;
  rule: OverrideRule;
  configFile: string;
}> {
  const file = resolveConfigFile(options.configPath, options.cwd);
  const config = readConfig(file);

  if (!Array.isArray(config.overrides) || config.overrides.length === 0) {
    throw new Error('No rules found in configuration to toggle.');
  }

  let targetIdx = -1;
  const rawInput = String(options.pathOrIndex).trim();

  // Check if number
  const num = parseInt(rawInput, 10);
  if (!isNaN(num) && num >= 0 && num < config.overrides.length) {
    targetIdx = num;
  } else {
    // Search by path match
    targetIdx = config.overrides.findIndex(
      (r) => r.path.toLowerCase() === rawInput.toLowerCase()
    );
  }

  if (targetIdx === -1) {
    throw new Error(`Rule not found matching "${rawInput}". Use back_overrides_list_rules to see available rules.`);
  }

  const targetRule = config.overrides[targetIdx];
  const newDisabledState =
    options.disabled !== undefined ? options.disabled : !Boolean(targetRule.disabled);

  targetRule.disabled = newDisabledState;
  writeConfig(file, config);

  const stateStr = newDisabledState ? 'DISABLED' : 'ACTIVE';
  return {
    success: true,
    message: `Rule #${targetIdx} (${targetRule.path}) is now ${stateStr}.`,
    rule: targetRule,
    configFile: file,
  };
}
