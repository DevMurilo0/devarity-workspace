# Devarity Workspace

O **Devarity Workspace** é o espaço de trabalho da **Devarity** para **Murilo e Davi**, com foco em clareza, responsabilidades e entregas. Feito em **HTML + CSS + JavaScript**, sem npm, sem build e pronto para abrir pelo Live Server.

## Objetivo

Centralizar demandas da equipe, dividir responsabilidades e acompanhar entregas com clareza. A identidade mantém a marca principal **Devarity** e identifica o produto como **Workspace**, preservando o visual escuro e as interações existentes.

## Tecnologias

HTML5, CSS3 com layout responsivo e animações, JavaScript com módulos ES, `localStorage`, Firebase Authentication e Cloud Firestore. O SDK Firebase 11.10.0 é carregado pelo CDN apenas no modo online. Ícones SVG e feedback sonoro pela Web Audio API são definidos no próprio código.

## Funcionalidades

- Criar, editar, duplicar, concluir, reabrir e excluir tarefas, com opção de desfazer a exclusão.
- Campos: título, descrição, responsável (Murilo, Davi ou ambos), categoria, demanda/projeto, prioridade, status, data de entrega e checklist de subtarefas.
- Visão geral com estatísticas de entregas, tarefas em foco, próximos prazos, progresso e atividade recente.
- Lista completa organizada por etapas; quadro Kanban com arrastar/soltar e seleção acessível de etapas; calendário mensal de entregas; histórico de concluídas.
- Busca por título, descrição, projeto e subetapas; filtros por pessoa, categoria, prioridade, projeto e ordenação.
- Sons discretos opcionais; visual escuro; suporte a teclado e celular; respeito a `prefers-reduced-motion`.
- Exportação em JSON e importação no modo local.
- Sincronização **em tempo real** com Firebase Firestore, com login por e-mail/senha e acesso restrito aos membros autorizados.

## Comece agora: modo local (sem configuração)

1. Clone este repositório ou extraia o ZIP.
2. Abra a pasta do projeto (por exemplo, `devarity-workspace`) no VS Code e instale a extensão **Live Server**, caso ainda não esteja instalada.
3. Clique com o botão direito em `index.html` → **Open with Live Server** (ou execute `python3 -m http.server 5500` dentro da pasta e acesse `http://localhost:5500`).
4. Na primeira execução local, o site inicia com seis tarefas **fictícias de exemplo**. Nas próximas visitas, mantém os dados já salvos. Use **Nova tarefa** para criar as suas.

**Importante:** o modo local guarda dados no `localStorage` do navegador: persiste entre recargas e sincroniza tarefas e atividades entre abas da mesma origem, sem depender do Firebase, mas **não sincroniza computadores ou celulares diferentes**. Para Murilo e Davi compartilharem as mesmas tarefas, faça a configuração do modo online abaixo.

## Armazenamento e compatibilidade

As chaves técnicas da versão anterior foram mantidas intencionalmente. Não as renomeie por causa da marca:

| Chave no `localStorage` | Conteúdo |
| --- | --- |
| `devarity-flow/tasks/v2` | Tarefas locais |
| `devarity-flow/activity/v2` | Atividade recente local |
| `devarity-flow/person` | Perfil escolhido no modo local |
| `devarity-flow/sound` | Preferência de sons |

Nenhuma migração é necessária. Os dados continuam disponíveis na mesma origem (protocolo, domínio e porta), no mesmo navegador e perfil. Trocar a porta do Live Server ou o domínio de publicação cria outra origem de armazenamento. Exporte um backup antes dessa mudança e importe no modo local da nova origem. Limpar os dados do navegador remove os registros locais.

Novas exportações usam `app: "Devarity Workspace"`, `version: 2` e o nome `devarity-workspace-backup-AAAA-MM-DD.json`. O arquivo contém tarefas, incluindo subtarefas, mas não inclui atividades ou preferências.

A importação local continua aceitando backups identificados como **Devarity Flow**, backups com o novo nome e listas JSON de tarefas. O nome em `app` não restringe a importação. As tarefas são validadas e mescladas pelo ID: registros importados substituem tarefas locais com o mesmo ID. O limite é de 5 MB por arquivo e 1000 tarefas por importação. No modo online, a importação está desativada; a exportação continua disponível.

## Ativar compartilhamento verdadeiro: Firebase

O Firebase oferece um backend hospedado que sincroniza tarefas e identifica cada integrante. O site não exige Node ou npm para rodar.

1. Para uma instalação nova, acesse https://console.firebase.google.com e crie um projeto (por exemplo, `devarity-workspace`). Se já utiliza Firebase, mantenha o projeto e a configuração existentes.
2. Dentro dele, adicione um **aplicativo Web** em *Configurações do projeto → Seus apps*. Copie `apiKey`, `authDomain`, `projectId` e `appId`.
3. Abra `js/firebase-config.js` e preencha exatamente esses quatro campos com os dados do seu app Web. Deixe `workspaceId = "devarity"`.
4. Em **Authentication → Sign-in method**, ative **Email/Password**. Em **Authentication → Users**, crie manualmente uma conta para Murilo e uma para Davi. Guarde as respectivas **UIDs** exibidas na lista de usuários. Não precisa habilitar cadastro público.
5. Em **Firestore Database**, crie um banco de dados, escolhendo a região apropriada ao projeto. Na aba **Rules**, substitua as regras inteiras pelo conteúdo do arquivo `firebase/firestore.rules` e clique **Publish**. Não publique com regras de teste que liberem acesso geral.
6. Em **Firestore Database → Data**, crie os documentos abaixo. Digite as UIDs **reais** de cada usuário como os IDs dos documentos. Os campos `active` devem ser booleanos, não strings:

   ```text
   workspaces/
     devarity/
       members/
         UID_DO_MURILO:
           active: true       [boolean]
           personId: "murilo"  [string]
           name: "Murilo"     [string]
         UID_DO_DAVI:
           active: true       [boolean]
           personId: "davi"    [string]
           name: "Davi"       [string]
   ```

   No console, ao criar `members`, o Firebase também pode pedir que você crie o documento pai `workspaces/devarity`. Ele pode ser um documento vazio (ou com um campo `name: "Devarity"`), pois as regras bloqueiam seu acesso pela aplicação. Use **Add collection** para criar `members` dentro desse documento.

7. Em **Authentication → Settings → Authorized domains**, adicione o domínio onde o site ficará hospedado (por exemplo `seu-site.pages.dev`, `seu-site.netlify.app` ou `seu-site.vercel.app`). Para Live Server local, use `localhost` se ele não constar na lista. Os dois deverão entrar cada um com seu próprio email e senha.
8. Abra novamente pelo Live Server ou publique a pasta em um host estático. **As tarefas aparecerão iguais e serão atualizadas ao vivo para os dois.**

O rebranding preserva `workspaceId = "devarity"` e os caminhos existentes:

- `workspaces/devarity/members/{uid}`
- `workspaces/devarity/tasks/{taskId}`
- `workspaces/devarity/activity/{eventId}`

Não crie outro workspace nem altere as coleções, UIDs ou regras por causa do novo nome. As instruções de criação acima são destinadas a instalações novas. Na instalação existente, continue usando os mesmos dados e permissões.

### Sessão persistente e autorização

O login usa `setPersistence(auth, browserLocalPersistence)` uma vez, antes de observar a sessão e permitir a entrada. A persistência local já é o comportamento padrão do Firebase Auth na Web; a configuração explícita fixa essa política. O próprio SDK guarda e renova a sessão. A aplicação não salva senhas ou tokens manualmente.

O `onAuthStateChanged` recupera a sessão nas próximas visitas. O estado `initializing` mostra a marca e um indicador discreto, sem exibir o formulário ou o dashboard. Para liberar o estado `authenticated`, o aplicativo consulta **o servidor** em `workspaces/devarity/members/{uid}` e exige `active === true` e `personId` igual a `murilo` ou `davi`. Sem sessão, usa `unauthenticated` e apresenta o formulário.

O documento de membro continua sendo observado durante o uso. Uma revogação confirmada bloqueia a interface, remove os dados em memória, interrompe os listeners e encerra a sessão. Respostas antigas de verificações e snapshots são ignoradas após troca de conta, logout ou nova tentativa de verificação. As regras do Firestore continuam sendo a proteção efetiva dos dados.

Uma falha de conexão na verificação bloqueia o painel, preserva a sessão Firebase e oferece **Tentar novamente**. Após 12 segundos sem confirmação, a interface também permite repetir a tentativa, sem presumir falta de autorização. **Sair da conta**, nas configurações, executa `signOut`; novas visitas exigem login novamente.

A sessão persiste após recarga, fechamento da aba ou navegador e reinicialização do computador no mesmo navegador, perfil e origem. Isso depende da disponibilidade do armazenamento, da validade da sessão e das políticas do navegador. Limpar os dados do site, usar navegação privada ou bloquear armazenamento pode impedir a persistência. Uma sessão válida não substitui a autorização no Firestore, e uma nova visita precisa de conexão para confirmar o acesso.

O formulário mantém `autocomplete="username"` e `autocomplete="current-password"`. Campos usam tema escuro inclusive em estados `:autofill` e `:-webkit-autofill`, com suporte ao seletor específico do Firefox quando disponível. Há controle de exibição de senha, aviso de Caps Lock, foco visível e feedback de carregamento. Não há cadastro público nem sons automáticos no login.

### Composição visual do login

O login preserva a logo oficial, Manrope nos títulos e DM Sans no corpo. No desktop, o formulário ocupa 46% da tela e divide espaço com uma composição de planos conectados e tipografia ampla em lilás, remetendo ao planejamento e às entregas do Workspace. Até 850 px, a arte lateral é ocultada e o formulário passa a uma coluna centralizada; em telas pequenas, espaçamentos e tipografia se ajustam, mantendo os controles acessíveis.

Os estilos específicos ficam em `css/auth.css`: fundo carvão (`#151617`), campos (`#202125`), ação principal lilás (`#c3afff`) e bordas dos campos (`#72707c`). Interações e entradas usam durações de 140 a 260 ms; indicadores de espera e o traçado decorativo têm ciclos próprios. Com `prefers-reduced-motion: reduce`, transições e animações são desativadas, mantendo indicadores estáticos de carregamento.

### Como publicar

Suba o conteúdo da pasta `devarity-workspace` para Netlify, Cloudflare Pages ou Vercel como **site estático**. Não há comando de build, pasta `dist` ou dependências locais. O arquivo inicial é `index.html`. Configure a raiz do repositório como diretório publicado e deixe o comando de build vazio. Após publicar, verifique o domínio autorizado no Firebase. Se estiver atualizando uma instalação existente, mantenha o domínio para preservar a origem do armazenamento local.

### Notas de segurança

- As chaves Firebase para Web são **identificadores públicos**, não senhas. Mesmo assim, nunca coloque senhas dos usuários no código.
- **As regras do Firestore são obrigatórias** para restringir o acesso. As regras incluídas exigem um membro `active = true` pré-autorizado pelo dono do projeto. O aplicativo impede criação de novas contas.
- As regras protegem o acesso ao workspace, mas **não oferecem perfis de permissões granulares**: ambos os membros podem editar e apagar as tarefas do time. É o comportamento esperado neste projeto de duas pessoas.
- O campo `personId` precisa ser exatamente `murilo` ou `davi`, conforme o integrante.
- Quando o modo online está habilitado, os dados locais de teste **não são enviados automaticamente** para a nuvem. Em uma instalação nova, o banco começa vazio; uma configuração existente continua lendo os documentos já armazenados. O backup local pode ser exportado antes de ativar a conexão.
- O histórico de atividade é informativo, não um registro de auditoria imutável: usuários autorizados podem inserir novos eventos via cliente.
- O modo online depende da conexão com a internet para carregar os módulos Firebase e sincronizar mudanças.
- Faça backups JSON periodicamente; exclusões permanentes no Firestore não têm lixeira no servidor.

## Teclas de atalho

| Tecla | Ação |
| --- | --- |
| `N` | Criar tarefa |
| `/` ou `Ctrl+K` | Ir à busca |
| `G` | Voltar à visão geral |
| `Esc` | Fechar menu, modal ou formulário |

## Estrutura do projeto

```text
devarity-workspace/
├── index.html                  Interface principal
├── assets/
│   ├── devarity-logo.webp       Logo interna oficial (barra lateral, seletor, login e carregamento)
│   └── devarity-workspace-1000126143.png  Favicon exclusivo da aba
├── css/
│   ├── styles.css              Estilos do Workspace
│   └── auth.css                Login, inicialização, autofill e motion
├── js/
│   ├── app.js                  Interface, eventos e navegação
│   ├── storage.js              Modo local e Firebase em tempo real
│   └── firebase-config.js      Configuração do seu projeto Firebase
├── firebase/
│   └── firestore.rules         Regras seguras do banco
├── tests/
│   └── auth.test.mjs           Regressões de autenticação e autorização
└── README.md                   Instalação e configurações
```

## Personalização

- Alterar paleta: variáveis `:root` em `css/styles.css`.
- Alterar categorias: listas `categories` e `catColors` em `js/app.js` e opções do formulário em `index.html`. Atualize também `safeTask` em `js/storage.js` e os nomes permitidos nas regras do Firestore.
- Nomes e iniciais dos responsáveis estão preparados para **Murilo** e **Davi**.
- Desativar sons: ícone de volume na barra superior ou em Configurações. Eles começam desativados, respeitando a escolha do usuário.

Feito para tirar ideias do papel. **Devarity Workspace.**

## Identidade visual oficial

A identidade usa dois arquivos locais com finalidades distintas:

- **Logo interna:** `assets/devarity-logo.webp`, usada na barra lateral, seletor Workspace, login e carregamento da autenticação. Os metadados Open Graph/Twitter também apontam para a logo, com dimensões de 720 × 572 px.
- **Favicon da aba:** `assets/devarity-workspace-1000126143.png`, usado exclusivamente em uma declaração `rel="icon"`. A URL inclui `?v=2` para invalidar o cache da declaração anterior. Não há favicons alternativos ou ícones Apple concorrentes.

Os arquivos não foram convertidos nem modificados. A logo mantém a transparência, as proporções e as cores originais, usando `object-fit: contain` nas caixas existentes, sem alterar layout, espaçamentos ou animações. As referências ficam no `index.html`, sem depender de JavaScript para exibir a marca durante a inicialização.

Os metadados usam caminhos locais relativos. Ao configurar um domínio público definitivo, use a URL absoluta da logo hospedada no próprio site em `og:image` e `twitter:image`, para compatibilidade com serviços de compartilhamento que exigem URLs absolutas.

**Conectividade:** os assets da marca são locais. As fontes DM Sans e Manrope continuam via Google Fonts, com fontes de sistema como alternativa; o Firebase continua usando o SDK remoto no modo online. Não há service worker para disponibilizar o site publicado offline. Não é necessário instalar dependências.

Validação da separação entre logo e favicon:

- Chromium: carregamento, barra lateral e identificador do workspace em 320, 390, 768 e 1440 px, com escala de pixels 2×; login em 360, 390, 768, 1366 e 1920 px.
- Quatro imagens da logo WebP decodificadas, proporções preservadas com `object-fit: contain`, ausência de filtros, sem erros JavaScript nem falhas HTTP dos assets; favicon solicitado pelo navegador e conferido após recarga.
- Uma única declaração de favicon apontando para o PNG de 512 × 512 px; nenhuma ocorrência desse PNG na interface ou nos metadados.
- Os 15 testes de autenticação passaram com `node --experimental-vm-modules --test tests/auth.test.mjs`.
- Regressão no navegador: tarefas, checklist, edição, conclusão, exclusão, persistência, importação/exportação, navegação e sincronização local entre abas. Login, logout, sessão restaurada, revogação e recuperação após falha de rede também passaram com o SDK de autenticação e serviços Firebase simulados, sem acessar dados de produção.

## Preferência de texto

A interface usa textos sem hífens visíveis. Palavras compostas da interface, mensagens de erro e espaços de data vazios foram ajustados. Hífens técnicos em nomes de classes CSS, caminhos, URLs, atributos HTML e valores de datas devem permanecer intactos para preservar o funcionamento.

## Testes de autenticação

Para executar as regressões sem instalar dependências, use Node.js 22 ou superior (necessário apenas para os testes):

```bash
node --experimental-vm-modules --test tests/auth.test.mjs
```

Os testes exercitam o gateway real com módulos Firebase simulados: ordem da persistência, credenciais inválidas, sessão restaurada, autorização obrigatória, membro removido ou inativo, falha de rede, logout e respostas concorrentes. Não acessam produção nem validam credenciais reais. O aviso de módulos VM experimentais é esperado nessa versão do Node.

Na validação desta alteração, passaram 15 testes automatizados. No Chromium, o SDK oficial do Firebase Auth com rede e Firestore simulados foi exercitado em login, logout, restauração após reiniciar o navegador, revogação sem exibir o painel e nova tentativa após falha de conexão. Também foram verificados o preenchimento, texto e cursor escuros no pseudoestado de autofill do Chromium, além do visual, controles e suporte a seletores no Firefox. O preenchimento por um gerenciador de senhas real e credenciais de produção não foram testados.

A validação de uma instalação real deve incluir login com uma conta autorizada, recarga, fechamento e reabertura do navegador no mesmo perfil, logout, nova visita e revogação do membro. Não coloque credenciais privadas nos arquivos de teste.
