import { Router, static as expressStatic } from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { absolutePath } from 'swagger-ui-dist';
import yaml from 'js-yaml';

/**
 * Factory function to create and configure the Express router for API documentation.
 * Serves static assets for Swagger UI and handles gated token authentication for access.
 * @returns Configured Express Router.
 */
export const makeDocsRouter = (): Router => {
  const router = Router();

  // Load the openapi specification on bootstrap/init
  const openapiSpecPath = path.resolve(process.cwd(), 'docs/api/openapi.yaml');
  let openapiSpecJson = '{}';
  try {
    const raw = fs.readFileSync(openapiSpecPath, 'utf-8');
    openapiSpecJson = JSON.stringify(yaml.load(raw));
  } catch {
    // Fallback: empty object, Swagger UI will show "No spec provided"
  }

  // Unprotected static assets of swagger-ui-dist
  const swaggerUiAssetPath = absolutePath();
  router.use('/assets', expressStatic(swaggerUiAssetPath));

  // Page gate (login screen)
  const renderLoginPage = (hasToken: boolean): string => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso Restrito — Biblioteca Digital API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-gradient-start: #0f172a;
      --bg-gradient-end: #1e1b4b;
      --card-bg: rgba(30, 41, 59, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --error: #ef4444;
      --radius: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--text-main);
    }

    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-container {
      margin-bottom: 24px;
    }

    .logo-icon {
      font-size: 40px;
      margin-bottom: 8px;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    p.desc {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 30px;
      line-height: 1.5;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      width: 100%;
    }

    label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: rgba(15, 23, 42, 0.6);
      color: var(--text-main);
      font-family: inherit;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type="password"]:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    button {
      width: 100%;
      padding: 14px;
      border-radius: 8px;
      border: none;
      background: var(--primary);
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 10px;
    }

    button:hover {
      background: var(--primary-hover);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      color: var(--error);
      font-size: 14px;
      margin-top: 8px;
      text-align: left;
      font-weight: 500;
      min-height: 1.2em;
    }

    .open-link {
      display: inline-block;
      margin-top: 10px;
      text-decoration: none;
      color: white;
      background: var(--primary);
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .open-link:hover {
      background: var(--primary-hover);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <div class="logo-icon">📚</div>
      <h1>Documentação da API</h1>
      <p class="desc">${hasToken ? 'O acesso ao Swagger UI da Biblioteca Digital requer autenticação por token.' : 'Acesse a documentação completa da Biblioteca Digital API em Swagger UI.'}</p>
    </div>

    ${
      hasToken
        ? `<form id="gate-form" novalidate>
      <div class="input-group">
        <label for="token-input">Token de Acesso</label>
        <input id="token-input" type="password" placeholder="Digite seu SWAGGER_TOKEN" autocomplete="off" autofocus>
      </div>
      <div class="error-message" id="error-msg" role="alert"></div>
      <button type="submit" id="submit-btn">Acessar Documentação →</button>
    </form>`
        : `<a class="open-link" href="/docs/ui">Abrir Swagger UI →</a>`
    }
  </div>

  ${
    hasToken
      ? `<script>
    const form = document.getElementById('gate-form');
    const input = document.getElementById('token-input');
    const errorMsg = document.getElementById('error-msg');
    const btn = document.getElementById('submit-btn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorMsg.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Verificando…';

      const token = input.value.trim();
      if (!token) {
        errorMsg.textContent = 'Informe o token de acesso.';
        btn.disabled = false;
        btn.textContent = 'Acessar Documentação →';
        return;
      }

      fetch('/docs/ui', {
        method: 'GET',
        headers: { 'x-docs-token': token }
      })
      .then(function (res) {
        if (res.ok) {
          sessionStorage.setItem('docs_token', token);
          window.location.href = '/docs/ui?t=' + encodeURIComponent(token);
        } else {
          errorMsg.textContent = 'Token inválido. Tente novamente.';
          input.value = '';
          input.focus();
        }
      })
      .catch(function () {
        errorMsg.textContent = 'Erro de conexão. Tente novamente.';
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Acessar Documentação →';
      });
    });
  </script>`
      : ''
  }
</body>
</html>`;
  };

  const renderSwaggerUI = (): string => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Biblioteca Digital API — Swagger UI</title>
  <link rel="stylesheet" href="/docs/assets/swagger-ui.css">
  <link rel="icon" type="image/png" href="/docs/assets/favicon-32x32.png" sizes="32x32">
  <link rel="icon" type="image/png" href="/docs/assets/favicon-16x16.png" sizes="16x16">
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs/assets/swagger-ui-bundle.js"></script>
  <script src="/docs/assets/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      const spec = ${openapiSpecJson};

      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset,
        ],
        layout: 'StandaloneLayout',
        validatorUrl: null,
      });
    };
  </script>
</body>
</html>`;
  };

  // GET /docs -> Gate page (Token form or link to UI)
  router.get('/', (_req: Request, res: Response) => {
    const hasToken = Boolean(process.env.SWAGGER_TOKEN);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderLoginPage(hasToken));
  });

  // GET /docs/ui -> Swagger UI, protected by SWAGGER_TOKEN if configured
  router.get(
    '/ui',
    (req: Request, res: Response, next: NextFunction) => {
      const token = process.env.SWAGGER_TOKEN;

      if (token) {
        const provided =
          (req.headers['x-docs-token'] as string | undefined) ??
          (req.query['t'] as string | undefined);

        if (provided !== token) {
          res.status(401).redirect('/docs');
          return;
        }
      }

      next();
    },
    (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(renderSwaggerUI());
    },
  );

  return router;
};
