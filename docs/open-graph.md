# Banner e metadados de compartilhamento

O arquivo publicado é `assets/devarity-workspace-og.png`, PNG RGB de 1200 × 630 px. É independente da logo WebP interna e do favicon PNG. O `index.html` fornece os metadados diretamente no HTML, inclusive quando JavaScript está desativado e o visitante não tem sessão.

A arte usa Manrope e DM Sans, grafite e lilás da aplicação. A logo original é apresentada com `object-fit: contain`. Três planos conectados retomam a composição abstrata do login, sem reproduzir o dashboard ou expor dados privados. O texto secundário opcional foi omitido para manter a leitura em prévias pequenas.

## Reexportar a arte

A aplicação continua sem build ou dependências npm. As dependências abaixo são opcionais e usadas somente para gerar a imagem, fora do repositório:

```bash
npm install --prefix /tmp/devarity-og-tools playwright sharp
/tmp/devarity-og-tools/node_modules/.bin/playwright install chromium
NODE_PATH=/tmp/devarity-og-tools/node_modules node docs/render-og.cjs
```

Para usar um Chromium já instalado, defina também `CHROME_PATH=/caminho/para/chrome`. A exportação carrega as fontes do Google Fonts e valida sua disponibilidade. Renderiza a composição a 2× com Playwright, reduz para 1200 × 630 e otimiza o PNG com Sharp. O PNG final não depende das fontes ou de serviços externos para ser exibido.

## Conferir o deploy

```bash
curl -I https://devarity-workspace.vercel.app/assets/devarity-workspace-og.png
curl -A 'facebookexternalhit/1.1' https://devarity-workspace.vercel.app/
```

A imagem deve responder HTTP 200 e `Content-Type: image/png`, sem autenticação, cookies ou redirecionamentos. O HTML deve conter uma única imagem principal Open Graph, dimensões 1200 × 630, canonical e URLs HTTPS absolutas. O banner não deve aparecer em elementos `<img>` da interface.

## Prévias e cache

Validadores externos mostram simulações; a plataforma decide a aparência final do cartão. Testes com user agents de crawlers verificam acesso e metadados, não comprovam o comportamento dos aplicativos reais.

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/): solicite nova coleta quando necessário; pode exigir login.
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/): inspecione a URL publicada; pode exigir login.
- [Liinks Open Graph Debugger](https://www.liinks.co/open-graph-debugger): inspeção pública de tags e simulações de cartões.

WhatsApp, Discord, Telegram, Facebook, LinkedIn e X podem reutilizar prévias antigas por algum tempo. Um novo envio não garante atualização imediata. Ao substituir a arte futuramente, atualize a versão da URL de imagem nos metadados e solicite nova coleta nas ferramentas disponíveis. Não remova a autenticação do dashboard para habilitar compartilhamento: apenas o HTML institucional e o asset estático precisam ser públicos.
