import { getProjectPaths } from '../utils/paths.js';
import { getBackOverridesStatus } from './status.js';

export interface SnippetsResult {
  port: number;
  cliUrl: string;
  snippets: {
    devtoolsConsole: string;
    indexHtmlTag: string;
    npmModuleImport: string;
  };
  comparison: {
    extensionBenefits: string[];
    snippetBenefits: string[];
  };
}

export async function getSnippets(customPort?: number, cwd?: string): Promise<SnippetsResult> {
  const paths = getProjectPaths(cwd);
  const status = await getBackOverridesStatus(paths.repoRoot);

  const port = customPort || status.port || 8888;
  const cliUrl = `http://localhost:${port}`;
  const scriptUrl = `${cliUrl}/__back-overrides/client.js`;

  return {
    port,
    cliUrl,
    snippets: {
      devtoolsConsole: `fetch('${scriptUrl}').then(r=>r.text()).then(eval);`,
      indexHtmlTag: `<script src="${scriptUrl}"></script>`,
      npmModuleImport: `import { setupBackOverrides } from '@back-overrides/client';\nsetupBackOverrides({ cliUrl: '${cliUrl}' });`,
    },
    comparison: {
      extensionBenefits: [
        'Intercepta navegações de tela cheia (main_frame / window.location.href), como links de login OAuth2 para BFF local',
        'Não requer qualquer alteração em arquivos de código do frontend',
        'Ativação/desativação instantânea pelo popup do navegador',
      ],
      snippetBenefits: [
        'Funciona em qualquer navegador (incluindo Safari, Firefox ou mobile em emuladores)',
        'Pode ser colado imediatamente no console do DevTools para testes rápidos',
        'Pode ser embutido no index.html de projetos de desenvolvimento',
      ],
    },
  };
}
