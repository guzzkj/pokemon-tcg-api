# Requisitos Técnicos - Parte 2
## Guia de estudo para apresentação

---

## 4.1 Idempotência

**Status: Implementado**

### Por que
Operações POST sem idempotência podem criar registros duplicados se o cliente reenviar a requisição (timeout, retry automático, clique duplo). A solução garante que a mesma operação seja processada uma única vez.

### Como

**Fluxo:**
1. Cliente envia `POST /cartas` com header `X-Idempotency-Key: criar-carta-001`
2. `IdempotencyFilter` intercepta a requisição antes de chegar no controller
3. Consulta `IdempotencyKeyRepository` — chave já existe para aquele endpoint?
4. Se **existe** → retorna HTTP 409 Conflict imediatamente, sem processar novamente
5. Se **não existe** → persiste a chave + endpoint + timestamp, deixa a requisição continuar

**Arquivos:**
| Arquivo | Papel |
|---|---|
| `infrastructure/IdempotencyFilter.java` | Extrai header, valida (máx 128 chars), verifica duplicata |
| `services/IdempotencyService.java` | Lógica de check + persistência no banco |
| `entities/IdempotencyKey.java` | Entidade com chave (PK), endpoint e processadaEm |
| `repositories/IdempotencyKeyRepository.java` | Consulta ao H2 |

**Exemplo:**
```http
POST /cartas
X-API-Key: sua_chave
X-Idempotency-Key: criar-charizard-001
Content-Type: application/json

{ "nome": "Charizard", ... }
```

Segunda chamada com mesma chave → `HTTP 409 Conflict`

### Perguntas prováveis
- **"Por que usar banco e não cache em memória?"** — Banco persiste entre restarts. Cache em memória some se a aplicação reiniciar.
- **"Qual é o escopo da chave?"** — A chave é única por `chave + endpoint`. A mesma chave `abc` em `/cartas` e em `/colecoes` são operações distintas.
- **"O que acontece se o cliente não enviar a chave?"** — A requisição passa normalmente. A idempotência é opt-in (só aplica quem envia o header).

---

## 4.2 Autenticação com Chave de API

**Status: Implementado**

### Por que
Sem autenticação, qualquer pessoa pode criar, alterar ou deletar dados. API Key é stateless, simples de implementar e adequada para APIs de backend-to-backend.

### Como

**Fluxo:**
1. Cliente gera chave via `POST /api-keys?nomeCliente=avaliador` (endpoint público)
2. API gera UUID aleatório, persiste no banco com `ativa = true`
3. Cliente envia `X-API-Key: <chave>` nas demais requisições
4. `ApiKeyFilter` valida a chave no banco antes de cada requisição protegida
5. Chave ausente ou inválida → HTTP 401 Unauthorized
6. Chave com `ativa = false` → HTTP 401 Unauthorized

**Endpoints públicos (sem X-API-Key):**
- `POST /api-keys` — geração da chave inicial
- `/swagger-ui.html`, `/api-docs` — documentação
- `/h2-console` — console do banco

**Arquivos:**
| Arquivo | Papel |
|---|---|
| `infrastructure/ApiKeyFilter.java` | Valida header em cada requisição protegida |
| `controllers/ApiKeyController.java` | `POST /api-keys` — geração |
| `services/ApiKeyService.java` | Geração UUID + validação de status |
| `entities/ApiKey.java` | Campo `ativa` para desativação sem deleção |

### Perguntas prováveis
- **"Por que UUID e não JWT?"** — JWT carrega claims e pode ser validado sem banco. UUID é mais simples, sem expiração, adequado para o escopo do projeto.
- **"Como revogar uma chave?"** — Campo `ativa = false` na entidade. Não deleta — mantém histórico.
- **"Por que /api-keys é público?"** — É o bootstrap. Sem isso o avaliador não consegue a chave para chamar nada.
- **"Qual a diferença para Basic Auth?"** — Basic Auth manda usuário+senha em base64 em cada request. API Key é um token opaco sem dados de usuário embutidos.

---

## 4.3 Rate Limiting

**Status: Implementado**

### Por que
Sem limite de taxa, um único cliente pode sobrecarregar a API com milhares de requisições por segundo, causando degradação para todos os clientes ou custos excessivos de infraestrutura.

### Como

**Limites diferenciados por método, por IP, janela de 60 segundos:**

| Grupo | Métodos | Limite |
|---|---|---|
| Leitura | GET, HEAD, OPTIONS | 60 req/min |
| Escrita | POST, PUT, PATCH, DELETE | 20 req/min |

**Fluxo:**
1. `RateLimitFilter` resolve o IP (via `X-Forwarded-For` ou `RemoteAddr`)
2. Classifica o método em `leitura` ou `escrita`
3. Mantém contadores separados em memória — chave `ip:r` e `ip:w`
4. Toda resposta recebe headers informativos com o limite do grupo
5. Quando limite excedido → HTTP 429 + `Retry-After`

**Headers em toda resposta:**
| Header | Significado |
|---|---|
| `X-RateLimit-Limit` | Limite do grupo (60 leitura / 20 escrita) |
| `X-RateLimit-Remaining` | Requisições restantes na janela |
| `X-RateLimit-Reset` | Segundos até reset |
| `Retry-After` | Segundos para tentar novamente (só no 429) |

**Arquivo:** `infrastructure/RateLimitFilter.java`

### Perguntas prováveis
- **"Por que contadores separados por método?"** — Um script de POST não consome cota dos GETs. Leitura e escrita têm perfis de risco distintos.
- **"Por que janela fixa e não sliding window?"** — Janela fixa é mais simples de implementar e suficiente para o escopo. Sliding window é mais preciso mas requer estrutura de dados mais complexa.
- **"O que acontece com o contador se a aplicação reiniciar?"** — Zera. O contador é in-memory (`ConcurrentHashMap`). Para produção real usaria Redis.
- **"Por que `X-Forwarded-For`?"** — Em produção a API fica atrás de um proxy/load balancer. O IP real do cliente vem nesse header, não em `RemoteAddr`.

---

## 4.4 CORS

**Status: Implementado**

### Por que
Navegadores bloqueiam requisições cross-origin por padrão (Same-Origin Policy). O frontend no GitHub Pages (`guzzkj.github.io`) precisa chamar a API em domínio diferente — sem CORS a requisição é bloqueada pelo browser antes de chegar na API.

### Como

**Origens permitidas:**
- `https://guzzkj.github.io` — frontend em produção (GitHub Pages)
- `http://localhost:3000` — Next.js dev
- `http://localhost:5173` — Vite dev
- `http://localhost:8080` — testes locais

**Métodos:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

**Headers que o cliente pode enviar:** `Content-Type`, `Authorization`, `X-API-Key`, `X-Idempotency-Key`, `X-API-Version`

**Headers que o cliente pode ler na resposta:** `Location`, `X-API-Version`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

**Arquivo:** `infrastructure/CorsConfig.java`

### Perguntas prováveis
- **"O que é preflight?"** — Antes de uma requisição com método ou header customizado, o browser faz um OPTIONS automático para checar se a origem tem permissão. A API responde com os headers de CORS e o browser libera (ou bloqueia) a requisição real.
- **"Por que expor os headers de rate limit no CORS?"** — Se não estiverem em `exposedHeaders`, o browser bloqueia o JavaScript de lê-los. O frontend precisa ler `X-RateLimit-Remaining` para mostrar o limite ao usuário.
- **"Por que não usar `allowedOrigins("*")`?"** — `*` não funciona com `allowCredentials(true)` e é inseguro — qualquer site poderia chamar a API em nome do usuário.

---

## 4.5 Versionamento da API

**Status: Implementado**

### Por que
APIs evoluem. Mudar a estrutura de resposta sem versionamento quebra clientes existentes. O versionamento via header mantém a URL estável e permite evolução sem breaking changes.

### Como

**Método:** Header personalizado `X-API-Version` (padrão: `v1`)

**Endpoint com duas versões:** `GET /cartas/{id}`

| Versão | Resposta |
|---|---|
| `v1` (padrão) | Campos base da entidade `Carta` |
| `v2` | Mesmos campos + `nomeCompleto` (ex: `"Charizard (POKEMON · 120 HP)"`) |

**Fluxo:**
1. Controller lê `@RequestHeader("X-API-Version")` com `defaultValue = "v1"`
2. Valida que está em `{v1, v2}` — retorna 400 se inválido
3. `v2`: transforma em `CartaV2Response` com campo calculado `nomeCompleto`
4. `v1`: retorna entidade base

**Arquivos:**
| Arquivo | Papel |
|---|---|
| `controllers/CartaController.java` | Leitura do header + branching v1/v2 |
| `dto/CartaV2Response.java` | Record com campo extra `nomeCompleto` |

**Frontend demonstra:** botão "Comparar v1/v2" na tela de cartas faz duas chamadas paralelas e exibe os JSONs lado a lado.

### Perguntas prováveis
- **"Por que header em vez de URL (`/v1/cartas`)?** — Versionamento por URL muda a identidade do recurso. Header mantém a URL estável. Ambos são válidos — a escolha foi para demonstrar a funcionalidade via header customizado.
- **"O que acontece se o cliente não enviar o header?"** — Recebe `v1` (default). Compatibilidade retroativa garantida.
- **"Por que só um endpoint versionado?"** — O requisito pede demonstração. `GET /cartas/{id}` é o caso mais didático — mesma URL, resposta diferente baseada no header.
- **"Como deprecar uma versão?"** — Adicionar header `Deprecation: true` e `Sunset: <data>` nas respostas da versão antiga para avisar os clientes.

---

## 5. Validações e Tratamento de Erros

### Bean Validation

**Status: Implementado**

| Anotação | Onde | Regra |
|---|---|---|
| `@NotBlank` | `Carta`, `Colecao`, `Serie`, `Tipo` | nome não pode ser vazio |
| `@Size` | campos de texto | limites de caracteres por campo |
| `@NotNull` | `Carta.colecao` | FK obrigatória |
| `@Min(10)` / `@Max(999)` | `Carta.pontosDeVida` | HP dentro do range válido do TCG |
| `@Positive` | path variables | ID deve ser positivo |

Controllers: `@Valid` no body, `@Validated` na classe para validar path/query params.

### Tratamento Global de Erros

**Status: Implementado**

`GlobalExceptionHandler.java` com `@RestControllerAdvice`:

| Exceção | HTTP | Quando ocorre |
|---|---|---|
| `RecursoNaoEncontradoException` | 404 | entidade não existe no banco |
| `TcgdexNaoEncontradoException` | 404 | carta não encontrada na API externa |
| `MethodArgumentNotValidException` | 400 | falha no `@Valid` (body) |
| `ConstraintViolationException` | 400 | falha em `@Validated` (path/query params) |
| `DataIntegrityViolationException` | 409 | constraint unique violada no banco |
| `HttpMessageNotReadableException` | 400 | JSON inválido ou tipo de campo errado |
| `MethodArgumentTypeMismatchException` | 400 | tipo errado em path/query param |

**Códigos de status usados na API:** 200, 201, 400, 401, 404, 409, 429

Todas as respostas de erro usam `ErrorResponse` com campos `codigo`, `titulo` e `mensagem`.

### Perguntas prováveis
- **"Por que `@RestControllerAdvice` e não try/catch em cada controller?"** — Centraliza o tratamento. Sem isso cada controller precisaria capturar as mesmas exceções repetidamente.
- **"Qual a diferença entre `@Valid` e `@Validated`?"** — `@Valid` ativa validação em beans (body). `@Validated` é necessário para validar parâmetros simples (`@PathVariable`, `@RequestParam`).
- **"Por que não tem handler para 500?"** — Por design — só tratamos erros previsíveis. Erros inesperados vão para o handler padrão do Spring Boot.

---

## 6. Documentação com Swagger/OpenAPI

**Status: Implementado**

**Dependência:** `springdoc-openapi-starter-webmvc-ui v3.0.2`

**Acesso local:** `http://localhost:8080/swagger-ui.html`

### O que foi documentado

- `@Operation` em todos os endpoints de todos os controllers
- `@ApiResponse` com **apenas os códigos que podem realmente ocorrer** por endpoint:
  - `200` — GETs e PUTs com sucesso
  - `201` — POSTs de criação
  - `400` — endpoints com `@Valid` ou parâmetros obrigatórios
  - `401` — todos os endpoints protegidos (exceto `/api-keys`)
  - `404` — endpoints que buscam por ID ou dependem de recurso existente
  - `409` — POSTs/PUTs onde existe constraint `unique` no banco (`Colecao.codigoExterno`, `Serie.idExterno`, `Tipo.nome`, `DetalheEstatistica.carta_id`)
  - `429` — todos os endpoints (rate limit aplica a tudo)
- `@Schema` nas entidades e DTOs com descrições e exemplos
- 3 `@SecurityScheme` no `OpenApiConfig`:
  - `ApiKeyAuth` — header `X-API-Key`
  - `IdempotencyKey` — header `X-Idempotency-Key`
  - `ApiVersion` — header `X-API-Version`

### Perguntas prováveis
- **"Por que o 409 não aparece em POST /cartas mas aparece em POST /colecoes?"** — `Carta` não tem nenhum campo com `@Column(unique=true)`. `Colecao` tem `codigoExterno` como unique. O Swagger só documenta o que pode realmente ocorrer.
- **"O que é `@SecurityScheme`?"** — Define no Swagger UI quais headers de segurança existem. Permite que o avaliador clique em "Authorize" e insira a API Key para testar os endpoints diretamente pelo browser.

---

## 7. Frontend

**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind CSS

**Produção:** GitHub Pages (`https://guzzkj.github.io/pokemon-tcg-api`)

**API em produção:** Render (`https://pokemon-tcg-3cl6.onrender.com`)

### Páginas

| Rota | O que faz |
|---|---|
| `/` | Dashboard — contadores (séries, coleções, cartas, tipos, detalhes) + quick links |
| `/cartas` | Lista cartas com busca, paginação, filtro por coleção, botão demo v1/v2 |
| `/colecoes` | CRUD completo de coleções |
| `/series` | CRUD completo de séries |
| `/tipos` | CRUD completo de tipos |
| `/detalhes` | CRUD de detalhes estatísticos |
| `/tcgdex` | Catálogo externo TCGdex (read-only, duas abas: cartas e coleções) |
| `/api-keys` | Gera nova chave, salva no localStorage, cola chave manual |

### Como a API Key funciona no frontend

1. Usuário acessa `/api-keys`, informa nome e clica "Gerar"
2. Frontend faz `POST /api-keys?nomeCliente=X`
3. Resposta contém `{ chave, id, ativa, criadaEm }`
4. Usuário clica "Usar esta chave" → salva em `localStorage["pokemon_api_key"]`
5. `lib/api.ts` lê do localStorage e injeta `X-API-Key` em todas as chamadas
6. Sem chave salva → requisições retornam 401 e o frontend exibe erro

### Demo de versionamento (v1/v2) no frontend

- Tela `/cartas` tem botão com ícone `GitCompare`
- Ao clicar, faz duas chamadas paralelas para `GET /cartas/{id}`:
  - Chamada 1: `X-API-Version: v1`
  - Chamada 2: `X-API-Version: v2`
- Modal exibe os dois JSONs lado a lado
- Diferença visível: `v2` inclui campo `nomeCompleto` (ex: `"Charizard (POKEMON · 120 HP)"`)

### Variáveis de ambiente

| Arquivo | Variável | Valor |
|---|---|---|
| `.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:8080` |
| `.env.production` | `NEXT_PUBLIC_API_URL` | `https://pokemon-tcg-3cl6.onrender.com` |

### Perguntas prováveis sobre o frontend
- **"Como o frontend sabe qual API chamar?"** — `NEXT_PUBLIC_API_URL` via variável de ambiente. Em dev aponta para `localhost:8080`, em produção para o Render.
- **"Por que GitHub Pages para o frontend?"** — Hospedagem estática gratuita. Next.js exportado como HTML/CSS/JS estático via `next export`.
- **"Por que a API Key fica no localStorage?"** — Simplicidade para demonstração. Em produção usaria HttpOnly cookie ou sessão autenticada para evitar XSS.
- **"O que acontece se a API no Render estiver dormindo?"** — Render free tier dorme após 15 min sem requisições. Primeira chamada demora ~30s para acordar. O frontend exibe erro de timeout nesse caso.
- **"O frontend usa HATEOAS?"** — Sim, parcialmente. As respostas incluem `_links` (HATEOAS), mas o frontend navega pelos links explícitos (IDs) em vez de seguir os `_links` dinamicamente.
- **"Por que CORS foi necessário?"** — Frontend está em `guzzkj.github.io` (domínio diferente da API no Render). Sem `CorsConfig` o browser bloquearia todas as requisições por violação de Same-Origin Policy.

---

## Resumo dos códigos HTTP por endpoint

| Endpoint | 200 | 201 | 400 | 401 | 404 | 409 | 429 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| GET /cartas | ✓ | | | ✓ | | | ✓ |
| GET /cartas/{id} | ✓ | | ✓¹ | ✓ | ✓ | | ✓ |
| POST /cartas | | ✓ | ✓ | ✓ | | | ✓ |
| PUT /cartas/{id} | ✓ | | ✓ | ✓ | ✓ | | ✓ |
| DELETE /cartas/{id} | | | | ✓ | ✓ | | ✓ |
| POST /colecoes | | ✓ | ✓ | ✓ | | ✓² | ✓ |
| PUT /colecoes/{id} | ✓ | | ✓ | ✓ | ✓ | ✓² | ✓ |
| POST /series | | ✓ | ✓ | ✓ | | ✓³ | ✓ |
| PUT /series/{id} | ✓ | | ✓ | ✓ | ✓ | ✓³ | ✓ |
| POST /tipos | | ✓ | ✓ | ✓ | | ✓⁴ | ✓ |
| PUT /tipos/{id} | ✓ | | ✓ | ✓ | ✓ | ✓⁴ | ✓ |
| POST /detalhes/carta/{id} | | ✓ | ✓ | ✓ | ✓ | ✓⁵ | ✓ |
| PUT /detalhes/{id} | ✓ | | ✓ | ✓ | ✓ | | ✓ |
| POST /api-keys | | ✓ | ✓ | | | | ✓ |

¹ 400 em `/cartas/{id}` = versão inválida (`X-API-Version` fora de `v1/v2`)
² `codigoExterno` tem `unique = true`
³ `idExterno` tem `unique = true`
⁴ `nome` tem `unique = true`
⁵ `carta_id` tem `unique = true` (relação 1:1)

---

## Resumo geral

| Requisito | Status | Arquivo principal |
|---|---|---|
| 4.1 Idempotência | ✅ | `infrastructure/IdempotencyFilter.java` |
| 4.2 Autenticação API Key | ✅ | `infrastructure/ApiKeyFilter.java` |
| 4.3 Rate Limiting | ✅ | `infrastructure/RateLimitFilter.java` |
| 4.4 CORS | ✅ | `infrastructure/CorsConfig.java` |
| 4.5 Versionamento | ✅ | `controllers/CartaController.java` + `dto/CartaV2Response.java` |
| 5. Bean Validation | ✅ | entidades + controllers |
| 5. Tratamento de Erros | ✅ | `exceptions/GlobalExceptionHandler.java` |
| 6. Swagger/OpenAPI | ✅ | `infrastructure/OpenApiConfig.java` + todos os controllers |
| Frontend | ✅ | Next.js em GitHub Pages, API no Render |
