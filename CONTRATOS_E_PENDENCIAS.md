# Matriz de contratos e pendências de integração

Fonte: **Especificação de Contratos — Módulo de Reuniões e Atas (backendColegiado)**, **Plano de Desenvolvimento: Sistema de Gestão de Colegiado**, **Documento de Requisitos**.

## Endpoints com método, rota e payload confirmados no contrato

| Ação | Método | Rota | JSON enviado |
|---|---|---|---|
| Listar reuniões | GET | `/api/reunioes` | sem body |
| Criar reunião | POST | `/api/reunioes` | `{"dataHora":"2026-11-27T14:00:00","local":"Sala 101"}` |
| Adicionar pauta | POST | `/api/reunioes/{id}/pautas` | `{"titulo":"Calendário acadêmico","ordemApresentacao":1,"deliberacao":"Aprovado"}` |
| Registrar participação | POST | `/api/reunioes/{id}/participacoes` | `{"membro":{"id":1},"statusPresenca":"PRESENTE","justificativaFalta":null}` |
| Finalizar e gerar ata | PUT | `/api/reunioes/{id}/finalizar` | **sem body** |

Reunião usa campos `id`, `dataHora`, `local`, `status`, `ataConteudo`, `dataGeracaoAta`. Pauta usa `id`, `titulo`, `ordemApresentacao`, `deliberacao`. Participação usa `id`, `membro:{id}`, `statusPresenca`, `justificativaFalta`. O JSON é **camelCase**; os valores de enum seguem os exemplos documentados.

## Referidos no plano, porém não detalhados no contrato anexado

| Tema | Hipótese atual no front-end | O que confirmar com o responsável |
|---|---|---|
| Login | `POST /api/auth/login` com `{email,senha}`, resposta `{token,usuario?}` | O DTO exato, nomes de campos e role na resposta; refresh/logout e expiração |
| Listar membros | `GET /api/membros` → `Membro[]` | Confirmação do shape da lista |
| Cadastrar membro | `POST /api/membros` com `{nome,email,matricula,papel,ativo,senha}` | Qual o DTO aceito e quais campos obrigatórios |
| Editar membro | `PUT /api/membros/{id}` com `{nome,email,matricula,papel,ativo}` | Método, rota, se PUT total ou PATCH parcial |
| Inativar membro | Reaproveita `PUT /api/membros/{id}` enviando `ativo:false` | Se há endpoint dedicado e como preservar histórico |
| Tipo de representante (RF-01) | Ainda não enviado ao backend | Campo para diferenciar docente/representante discente de perfil de autorização `MEMBRO` |
| Iniciar reunião | Nenhuma chamada implementada | O status `EM_ANDAMENTO` existe, mas não há rota no contrato para ativá-lo |
| Consultar pautas/presenças antigas | Lê arrays embutidos em cada reunião **se existirem**; caso contrário, cache de sessão apenas para o que o usuário acabou de salvar | Criar `GET /api/reunioes/{id}` com `pautas` e `participacoes`, ou `GET` por relacionamento |
| Editar deliberação | Nenhuma chamada implementada | POST de pauta inclui `deliberacao`, mas ainda não há PUT/PATCH documentado |
| Assinatura/declaração | Fora do escopo do integrante 4 | Integrantes 3 e 5 |

**Atenção:** o Plano de Desenvolvimento usa `ataTexto` em uma passagem, enquanto o documento específico de contrato define `ataConteudo`. Este front-end usa **`ataConteudo`** para interpretar a resposta do backend, por ser o campo do contrato explícito.

## Segurança / integração

- O perfil de coordenação é uma regra do **Spring Security**. Não basta esconder botões no navegador. Qualquer POST/PUT deve ser validado no servidor.
- Token é lido de `localStorage.authToken` e enviado como `Authorization: Bearer <token>` em modo API, como exige o plano acadêmico. Para produção, avalie com a equipe reduzir exposição a XSS usando sessões/cookies HttpOnly e políticas de CSP.
- Senhas só são enviadas via HTTPS fora de localhost. Nunca armazenar senha no front-end.
- A assinatura criptográfica e auditoria IP/UTC são tarefas do back-end, não do front-end.
- Se a aplicação abrir em `http://localhost:5500`, liberar essa **origem exata** no CORS do Spring Boot (sem abrir `*` desnecessariamente para APIs autenticadas).
- Um erro `500` por ID de membro inválido está previsto no PDF, mas recomenda-se ao integrante 1 corrigir isso no servidor para `400`/`404` com JSON explicativo.

## Checklist de aceite para o integrante 4

- [ ] Login no modo API responde e token é anexado às operações seguintes.
- [ ] Cadastrar e listar membros com os nomes dos campos definidos no DTO final.
- [ ] Editar/inativar membro após fechar contrato com o integrante 2.
- [ ] Criar reunião envia exclusivamente `dataHora` e `local`.
- [ ] Adicionar pauta envia `titulo`, `ordemApresentacao`, `deliberacao` para a reunião escolhida.
- [ ] Registrar presença envia `{membro:{id},statusPresenca,justificativaFalta}` e ID existente.
- [ ] Finalizar envia PUT sem body e exibe `ataConteudo` retornado.
- [ ] CORS funciona e erros 4xx/5xx apresentam mensagens compreensíveis.
- [ ] Recarregar a página permite recuperar pautas/presenças quando o backend disponibilizar leitura.
- [ ] No modo demo, todas as telas são navegáveis e não exigem servidor.
