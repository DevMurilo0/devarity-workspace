# Devarity Flow — Workspace de tarefas

Um site de tarefas para **Murilo e Davi**, com foco em clareza, responsabilidades e entregas. Feito em **HTML + CSS + JavaScript**, sem npm, sem build e pronto para abrir pelo Live Server.

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

1. Extraia o ZIP.
2. Abra a pasta `devarity-flow` no VS Code.
3. Clique com o botão direito em `index.html` → **Open with Live Server** (ou execute `python3 -m http.server 5500` dentro da pasta e acesse `http://localhost:5500`).
4. Pronto! O site inicia com seis tarefas **fictícias de exemplo**. Use **Nova tarefa** para criar as suas.

**Importante:** o modo local guarda dados no `localStorage` do navegador: funciona sem internet e entre abas do mesmo navegador, mas **não sincroniza computadores ou celulares diferentes**. Para Murilo e Davi compartilharem as mesmas tarefas, faça a configuração do modo online abaixo.

## Ativar compartilhamento verdadeiro: Firebase

O Firebase oferece um backend hospedado que sincroniza tarefas e identifica cada integrante. O site não exige Node ou npm para rodar.

1. Acesse https://console.firebase.google.com e crie um projeto (por exemplo, `devarity-flow`).
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

### Como publicar

Suba o conteúdo da pasta `devarity-flow` para Netlify, Cloudflare Pages ou Vercel como **site estático**. Não há comando de build, pasta `dist` ou dependências locais. O arquivo inicial é `index.html`.

### Notas de segurança

- As chaves Firebase para Web são **identificadores públicos**, não senhas. Mesmo assim, nunca coloque senhas dos usuários no código.
- **As regras do Firestore são obrigatórias** para restringir o acesso. As regras incluídas exigem um membro `active = true` pré-autorizado pelo dono do projeto. O aplicativo impede criação de novas contas.
- As regras protegem o acesso ao workspace, mas **não oferecem perfis de permissões granulares**: ambos os membros podem editar e apagar as tarefas do time. É o comportamento esperado neste projeto de duas pessoas.
- O campo `personId` precisa ser exatamente `murilo` ou `davi`, conforme o integrante.
- Quando o modo online está habilitado, os dados locais de teste **não são enviados automaticamente** para a nuvem. O banco começa vazio. O backup local pode ser exportado antes de ativar a conexão.
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
devarity-flow/
├── index.html                  Interface principal
├── assets/
│   └── (a marca é carregada do site oficial)
├── css/
│   └── styles.css              Estilos, layout e motion
├── js/
│   ├── app.js                  Interface, eventos e navegação
│   ├── storage.js              Modo local e Firebase em tempo real
│   └── firebase-config.js      Configuração do seu projeto Firebase
├── firebase/
│   └── firestore.rules         Regras seguras do banco
└── README.md                   Instalação e configurações
```

## Personalização

- Alterar paleta: variáveis `:root` em `css/styles.css`.
- Alterar categorias: listas `categories` e `catColors` em `js/app.js` e opções do formulário em `index.html`. Atualize também `safeTask` em `js/storage.js` e os nomes permitidos nas regras do Firestore.
- Nomes e iniciais dos responsáveis estão preparados para **Murilo** e **Davi**.
- Desativar sons: ícone de volume na barra superior ou em Configurações. Eles começam desativados, respeitando a escolha do usuário.

Feito para tirar ideias do papel. **Devarity Flow.**

## Identidade visual oficial

A marca geométrica fictícia da primeira versão foi removida. A versão atual exibe **a logo branca oficial da Devarity** na barra lateral, no identificador do workspace e na tela de login, usando este arquivo hospedado pelo site oficial:

- https://devarity.com.br/assets/devarity-logo-white.png
- Favicon original: https://devarity.com.br/assets/devarity-favicon.png

**Conectividade para os assets da marca:** as imagens acima são carregadas por URL, portanto dependem de acesso à internet. Todo o restante do HTML, CSS e JavaScript continua no ZIP e executa com Live Server. Para funcionar 100% offline, baixe os dois arquivos do domínio oficial para a pasta `assets/` e substitua os endereços absolutos nos campos `src` e `href` de `index.html` pelos caminhos locais correspondentes. Não é necessário instalar nenhuma dependência.

## Preferência de texto

A interface usa textos sem hífens visíveis. Palavras compostas da interface, mensagens de erro e espaços de data vazios foram ajustados. Hífens técnicos em nomes de classes CSS, caminhos, URLs, atributos HTML e valores de datas devem permanecer intactos para preservar o funcionamento.
