# Pokemon TCG API RESTful

API RESTful em Java 17 e Spring Boot para catalogo de cartas, colecoes, series, tipos e detalhes estatisticos do Pokemon TCG.

## Requisitos atendidos

| Item | Status | Onde verificar |
| --- | --- | --- |
| Spring Boot, Java 17 e Maven | Atendido | `api/pom.xml` |
| H2 em memoria + Spring Data JPA | Atendido | `api/src/main/resources/application.properties` |
| 5 entidades de dominio | Atendido | `api/src/main/java/senac/tsi/pokemontcg/entities` |
| Relacionamentos One-to-One, One-to-Many e Many-to-Many | Atendido | `Carta`, `Colecao`, `Serie`, `Tipo`, `DetalheEstatistica` |
| Bean Validation + enum | Atendido | entidades e `CategoriaCartaEnum` |
| CRUD completo por entidade | Atendido | controllers de `cartas`, `colecoes`, `series`, `tipos`, `detalhes` |
| Listagens paginadas | Atendido | parametros `page`, `size`, `sort` via `Pageable` |
| Consulta personalizada por entidade | Atendido | rotas `/buscar` e consultas relacionadas |
| Swagger/OpenAPI | Atendido | `http://localhost:8080/swagger-ui.html` |
| HATEOAS | Atendido | respostas com `_links`, `EntityModel` e `PagedModel` |
| Idempotencia em POST | Atendido | header `X-Idempotency-Key` |
| Autenticacao por API Key | Atendido | header `X-API-Key` |
| Rate limiting | Atendido | headers `X-RateLimit-*` e `Retry-After` |
| CORS | Atendido | `CorsConfig` |
| Versionamento por header | Atendido | `X-API-Version: v1` ou `v2` em `GET /cartas/{id}` |
| Tratamento global de erros | Atendido | `GlobalExceptionHandler` |

## Como executar

Entre na pasta da API e rode o Maven Wrapper:

```powershell
cd api
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
cd api
./mvnw spring-boot:run
```

Servicos locais:

| Recurso | URL |
| --- | --- |
| API | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| OpenAPI JSON | `http://localhost:8080/api-docs` |
| H2 Console | `http://localhost:8080/h2-console` |

Credenciais H2:

| Campo | Valor |
| --- | --- |
| JDBC URL | `jdbc:h2:mem:pokemondb` |
| User | `sa` |
| Password | vazio |

## Autenticacao

Gere uma chave:

```http
POST /api-keys?nomeCliente=avaliador
```

Use a chave retornada nas demais rotas:

```http
X-API-Key: sua_chave
```

Rotas publicas:

| Rota | Motivo |
| --- | --- |
| `/api-keys` | gerar chave inicial |
| `/swagger-ui.html` | documentacao |
| `/api-docs` | especificacao OpenAPI |
| `/h2-console` | console do banco local |

## Headers avancados

| Header | Uso | Exemplo |
| --- | --- | --- |
| `X-API-Key` | autenticar endpoints protegidos | `X-API-Key: abc123` |
| `X-Idempotency-Key` | evitar POST duplicado | `X-Idempotency-Key: criar-carta-001` |
| `X-API-Version` | escolher versao de resposta | `X-API-Version: v2` |

Rate limit retorna:

| Header | Significado |
| --- | --- |
| `X-RateLimit-Limit` | limite da janela |
| `X-RateLimit-Remaining` | requisicoes restantes |
| `X-RateLimit-Reset` | segundos ate reset |
| `Retry-After` | segundos para tentar de novo apos HTTP 429 |

## Exemplos rapidos

Listar cartas:

```http
GET /cartas?page=0&size=10&sort=nome,asc
X-API-Key: sua_chave
```

Buscar carta com versao 2:

```http
GET /cartas/1
X-API-Key: sua_chave
X-API-Version: v2
```

Criar carta com idempotencia:

```http
POST /cartas
X-API-Key: sua_chave
X-Idempotency-Key: criar-carta-001
Content-Type: application/json

{
  "nome": "Charizard",
  "categoria": "POKEMON",
  "pontosDeVida": 120,
  "imagemUrl": "https://assets.tcgdex.net/pt/base/base1/4/high.png",
  "numeroLocal": "4",
  "idExterno": "base1-4"
}
```

## Postman

Opcao 1: importar a colecao versionada:

1. Abra o Postman.
2. Use `Import`.
3. Selecione o arquivo `postman_collection.json`.
4. Execute primeiro `Setup > Gerar API Key`.
5. A variavel `apiKey` sera preenchida automaticamente.

Opcao 2: gerar a colecao pelo proprio OpenAPI:

1. Execute a API.
2. Abra o Postman.
3. Use `Import`.
4. Selecione `Link`.
5. Informe `http://localhost:8080/api-docs`.

## Testes

```powershell
cd api
.\mvnw.cmd test
```

Observacao: a carga inicial importa dados da TCGdex. Em ambientes sem internet, a inicializacao pode falhar ou ficar lenta.

## Tabela de importancia dos ajustes

| Prioridade | Ajuste | Por que importa | Status |
| --- | --- | --- | --- |
| Alta | Corrigir comando de execucao no README | avaliador precisa conseguir rodar projeto sem erro de diretorio | Feito |
| Alta | Corrigir URL do OpenAPI no README | Postman e avaliador dependem da URL certa | Feito |
| Alta | Documentar headers avancados no Swagger | criterios exigem API Key, idempotencia e versionamento claros | Feito |
| Media | Expor headers de rate limit no CORS | frontend consegue ler limite e retry | Feito |
| Media | Explicar fluxo de API Key | endpoints protegidos precisam de chave | Feito |
| Baixa | Gerar arquivo `postman_collection.json` versionado | entrega fica mais completa e facilita demonstracao | Feito |
