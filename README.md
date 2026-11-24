# Colegiado — Painel da Coordenação (Integrante 4)

Projeto front-end acadêmico desenvolvido em **HTML5, CSS3 e JavaScript ES6+ puro**, sem frameworks ou build. Segue as tarefas do integrante 4: autenticação, painel administrativo, membros, reuniões, pautas e controle de presença.

## Estrutura

```text
painel-coordenacao/
├─ index.html                  # redireciona para login
├─ login.html                  # autenticação e modo de execução
├─ painel-coordenador.html     # dashboard / atalhos / indicadores
├─ gestao-membros.html        # listagem, cadastro, edição, inativação
├─ gestao-reuniao.html        # reuniões, pautas, presenças, finalização e ata
├─ css/styles.css             # estilos, layout responsivo
├─ js/config.js               # URL-base e rotas
├─ js/core.js                 # layout, modal, feedback, helpers
├─ js/api.js                  # Fetch API, token e mapeamento de rotas
├─ js/demo-store.js           # dados de demonstração (localStorage)
├─ js/login.js                # eventos do login
├─ js/painel.js               # eventos do dashboard
├─ js/membros.js              # eventos dos membros
├─ js/reunioes.js             # eventos das reuniões
├─ CONTRATOS_E_PENDENCIAS.md  # matriz de integração e pendências
└─ tests/smoke-demo.mjs      # teste de lógica sem navegador
```

## Executando localmente

1. Abra esta pasta no **VS Code**.
2. Inicie um servidor estático, por exemplo usando a extensão Live Server na porta 5500, ou `python -m http.server 5500` nesta pasta.
3. Abra `http://localhost:5500/login.html`.
4. **Demonstração** (sem Spring Boot): credenciais `coordenacao@ifpa.edu.br` / `demo123`.
5. **API local**: selecione a opção na tela de login. Antes, inicie o Spring Boot na porta 8080 e configure o CORS para a origem do front-end.

> Importante: não abrir HTML via `file://`; módulos JavaScript ES6 requerem origem HTTP. A demonstração usa dados fictícios armazenados apenas no navegador; não é autenticação de verdade.

## Integração com o backend

- Base URL em `js/config.js`: `http://localhost:8080`.
- `POST /api/auth/login`: recebe credenciais e espera `{token: "..."}`; contrato incompleto, ajuste conforme o integrante 2.
- Demais requests usam `Authorization: Bearer <authToken>` obtido do login, conforme o plano da equipe.
- O módulo `js/api.js` centraliza a comunicação: não faça `fetch()` em cada componente.
- A implementação respeita os nomes `dataHora`, `ordemApresentacao`, `statusPresenca`, `justificativaFalta`, `ataConteudo` do contrato específico de reuniões.

**Consultar `CONTRATOS_E_PENDENCIAS.md` antes da integração**. O contrato anexo não especifica todos os endpoints do CRUD de membros nem a consulta de pauta/presença de reuniões já existentes. A interface deixa esses pontos visíveis em vez de inventar persistência no backend.

## Modo demonstração e testes manuais

- Cadastre um membro, edite e inative; use os filtros.
- Crie uma reunião com data e local.
- Adicione uma pauta à reunião.
- Registre uma pessoa como PRESENTE e outra como JUSTIFICADO (com justificativa).
- Finalize a reunião e confira a aba ATA.
- Atualize a página e volte ao dashboard para observar os indicadores.

Os dados são salvos no `localStorage` com a chave `colegiado_demo_db_v1`, e podem ser limpos pelo armazenamento do navegador para reiniciar a demonstração.

## Responsabilidades e limites

| Integrante 4 (este projeto) | Outros integrantes |
|---|---|
| Interface, validação visual, montagem do JSON, eventos DOM, `fetch`, exibição de resultados | Autenticação segura, autorização de rotas, banco PostgreSQL, hashes, emissão de documentos |
| Reuniões, pautas, presença, exibição da ata após finalizar | Backend de reuniões (1) e segurança/membros (2) |
| Página coordenador | Assinatura e emissão de declarações (3), portal do membro e validação pública (5) |

Esta interface **não é uma autorização de segurança**. A API deve bloquear operações sem permissão, inclusive tentativas diretas sem a interface.

## Verificação automática da lógica demonstrativa

Com Node.js 22 ou mais recente, execute `node tests/smoke-demo.mjs` na raiz da pasta. O teste verifica login, cadastro/edição de membros, criação de reunião, pauta, presença e finalização com ata. **Ele não substitui testes manuais de interface nem de integração com a API real**.
