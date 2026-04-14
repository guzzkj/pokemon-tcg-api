# 🎓 Dossiê de Defesa: API Pokémon TCG

Bem-vindo à fase de preparação Sênior. Este dossiê foi desenhado por um Tech Lead focado em formaturas de alto impacto. Ao absorver os conceitos aqui contidos, você não apenas será aprovado, mas impressionará a banca pelo vocabulário técnico e maturidade arquitetural.

---

## 1. Visão Geral do Sistema (O "Whiteboard Flow")

Se o professor pedir para você "desenhar no ar" como uma requisição ocorre na sua API, divida a explicação no clássico fluxo de "Camadas e Interceptações":

1. **A Chegada (DispatcherServlet):** Quando um cliente manda um `POST /cartas`, o "porteiro" nativo do Spring Web, chamado `DispatcherServlet`, intercepta o tráfego HTTP.
2. **Camada de Transporte (Controllers):** O porteiro roteia a requisição para o seu `CartaController`. O framework mágico do *Jackson* converte o corpo JSON na sua classe de Entidade. Ocorre a etapa de **Bean Validation** (`@Valid`). Se algo estiver fora do padrão, os validadores bloqueiam aqui e redirecionam para nosso "Hospital" (O ExceptionHandler).
3. **Camada de Negócios (Services):** Se válido, o Controller envia os dados limpos para a `CartaService`. É a camada pensante. Aqui a entidade sofrerá mutações, conversões ou será confrontada com regras de negócio e sanitizações (ex: tratamento de wildcards SQL).
4. **Camadas de Acesso a Dados e Consumo:** 
   - A requisição interna chamará os `Repositories` (A interface que conversa com o Data JPA), transformando os objetos de volta para tabelas SQL que engravam no Banco H2.
   - Requisições engajando a rota `/importar` delegam para o nosso `TcgdexClient`, ativando o Client HTTP (`RestClient`) que viaja pela Web até a API Americana e volta trazendo bytes mapeáveis para dentro.
5. **O Retorno Vigoroso (HATEOAS e Response):** Os dados são entregues de volta ao Controller que, antes de entregar ao cliente, empacota suas Classes em envelopes blindados (`EntityModel` ou `PagedModel`). O Controller apenda os Links Automáticos do Padrão HATEOAS, e envia tudo via rede envelopado perfeitamente sob os *HTTP Status Codes*.

---

## 2. Fundamentos Explicados de Forma Clara

### O que é uma API RESTful de verdade?
Muitos alunos confundem REST com "mandar JSON via Web". Errado. REST (Representational State Transfer) formulado por Roy Fielding baseia-se em 4 pilares prático-acadêmicos que nosso código acatou com primor:
* **Stateless:** Nossa API não sabe (nem lembra) do usuário. Cada requisição no seu `CartaController` traz tudo o que o servidor precisa na URL ou Payload para operar. Não há "Sessões Web".
* **Uso Correto dos Verbos HTTP e URIs:** O REST exige substantivos (`/cartas`) não ações (`/salvaCarta`). Você acertou isso e usou os métodos HTTP como intenção explícita (`GET` para trazer, `PUT` para idempontência pesada/atualizar o alvo, `DELETE` para matar e `POST` para inserir).
* **Códigos Fidedignos de HTTP:** Retornamos `201 Created` e devolvemos o localizador (Header Location) quando um salvamento ocorre. Fornecemos `204 No Content` no DELETE com sucesso. É REST sem adulteração.

### O Cérebro do Spring (Inversão de Controle - IoC e Injeção de Dependências - DI)
Na faculdade dizemos que se usa "Java puro", onde você faz `new CartaService()` toda hora. O Spring arranca isso da sua mão **(Inversão de Controle)**. O Spring inicia, mapeia todo o projeto e vira "O Dono" de todos os objetos (os famosos Beans: `@Service`, `@RestController`, `@Component`). 
Quando seu `CartaController` precisa da Service, ele não instancia o objeto; ele o solicita no seu Construtor, e o Spring empurra o objeto pronto **(Injeção de Dependências)**, evitando poluição de memória, lida de ciclos de vida e aniquilando riscos gigantes de falhas como NullPointerException.

A palavra *Opinionated* significa que o **Spring Boot** toma decisões estritas por você. Em invés de você gastar 20 linhas ligando o Tomcat e conectando um banco, o Spring já "opina": *"Ah, ele subiu o starter-data-jpa e o h2, ele obviamente quer rodar o banco sem arquivo de configuração, farei sozinho"*.

---

## 3. Raio-X da Complexidade (Ganchos Espinhosos)

### A. O ExceptionHandler Policial
**(`GlobalExceptionHandler.java`)** Sua classe blindada.
* **Linha por linha:** Você marcou a classe com `@RestControllerAdvice` engajando o design *Observer*. Ao invés de infestarmos o `CartaController` com 25 blocos "Try/Catch" feios, o Controller apenas confia no trabalho do Spring e cospe a Exception pura pra cima. Automaticamente, o `@ExceptionHandler(...)` captura e converte as Exceptions caóticas orgânicas (Ex: `DataIntegrityViolationException` ou do `ConstraintViolationException`) transmutando o erro violento em um lindo envelope JSON oficial de um `.Map` gerado pela sua classe com um assento de voo HTTP fixo (`400 Bad Request` ou `409 Conflict`).

### B. Integração Tolerante a Falha
**(`TcgdexClient.java` e `RestClientConfig.java`)** A defesa de Rede.
* **Linha por linha:** O uso prático da API RESTClient nova do Spring 3.2. A genialidade aqui não é o ".get().uri()", e sim o `.onStatus()`. No seu código, você usa a condicional Lamba pra inspecionar a nuvem antes de quebrar. Se o cliente responde que não acha (`.value() == 404`), forçamos localmente uma custom `TcgdexNaoEncontradoException`. E na fábrica do `RestClient` instalamos limites via `SimpleClientHttpRequestFactory (ReadTimeouts)`, ensinando o sistema que se o TCGdex parar de responder, nós forçamos o cancelamento interno em `5000ms`, garantindo sob alta demanda que nossa API sobreviva.

### C. A Conversão Dinâmica HATEOAS 
**(`PagedResourcesAssembler` e Links Dinâmicos)** Dentro do Controller.
* **Linha por linha:** O método `.toModel()` faz duas operações colossais. 1) Envolve os fragmentos da página com chaves exclusivas métricas ("size", "totalElements", "pageNumber"). E a parte genial: o `linkTo(methodOn(Classe.class).Metodo(id)).withRel()`. Usamos o poder forte da "Reflexão" e inspeção interna do Java. Nós pedimos ao Servidor que leia o próprio método `Metodo(id)`, calcule na mosca baseada na URL dele (`/cartas/2`) e fabrique de trás para frente a URL oficial injetando-a no node `_links` das respostas. 

---

## 4. Sabatina Real (Perguntas Desafiadoras do Professor)

**P1: Por que você utilizou injeção de dependência via 'Construtor' nas suas classes ao invés da anotação direta `@Autowired` em cima das variáveis da classe de controller?**
* **Resposta Ideal:** "A injeção por construtor garante a imutabilidade das dependências do nosso `Controller`, professor. Transformando os objetos da `Service` em variáveis `final` no meu código, nós garantimos que não ocorrerão reatribuições, fortalecemos as rotinas de Testes Unitários com o Mockito (tornando as instâncias visíveis no setup) e garantimos que o código do Controller nunca se inicialize no Spring Boot omitindo uma das engrenagens sem antes quebrar num erro rápido na compilação, prevenindo desastres de `NullPointerException` de surpresa em tempo de execução."

**P2: O que aconteceria exatamente com os recursos da máquina se a API Externa do Pokémon caísse em um momento de muitas requisições simultâneas e seu programa estivesse com a configuração básica desprotegida?**
* **Resposta Ideal:** "Uma catástrofe de *Thread Pool Exhaustion* (Esgotamento de Threads). As bibliotecas Web Clients padrão do Java sem configuração de Timeouts estritos escutam indefinidamente a conexão de rede da API fora do ar. As *Threads* processuais do servidor Tomcat ficariam travadas em espera eterna, levando seu consumo de processamento lá embaixo, impedindo novos acessos a qualquer rota interna e em última estância forçando a API a sair completamente do ar para toda a base web unida num ataque não-intencional de Negação de Serviço (DoS)."

**P3: Na sua função de deletar usando verbo DELETE, eu observei que você retorna `ResponseEntity.noContent().build()`. Existe algum motivo para o Código ser o famoso Error livre HTPP 204? E por que não o 200 OK tradicional?**
* **Resposta Ideal:** "É purismo conceitual REST, professor. O verbo DELETE foi arquitetado com a natureza de que, se uma exclusão operou magnificamente com sucesso destrutivo perante o banco, o recurso original foi desintegrado. Sendo um servidor stateless, a API não tem um 'recurso de listagem' remanescente e coerente desse objeto para re-injetar via JSON pro usuário. O Servidor diz: 'Tudo perfeito, mas eu não tenho mais nada para te mostrar do payload', ou seja, 204 No Content."

**P4: Qual a verdadeira utilidade de usar a propriedade HATEOAS, como você demonstrou incutindo enlaces *'Self'* e de *'Navegação'* no retorno JSON de Cartas e Coleções?**
* **Resposta Ideal:** "É a garantia gloriosa do Estado Desacoplado no REST. Quem gasta as nossas APIs nativas geralmente é o Frontend (Angular/React). Sem HATEOAS o meu Frontend teria a URL da rota de deleção e alteração fixa nas constantes (HardCoded) do Javascript deles (`/cartas/id2`). Com HATEOAS, o Front não cria as URIS de controle, ele consome livre os retornos dinâmicos sob demanda listados no array `_links`. Se a nossa coordenação Back-End decidir mudar o sufixo inteiro de versão de rotas amanhã, quem usa o nosso BackEnd HATEOAS não quebra."

**P5: Eu vou testar o seu API enviando uma JSON com um Tipo de Dado completamente indevido para forçar seu aplicativo e banco a darem erro. Por que meu teste irá falhar sendo que você tirou as instâncias excessivas do `try/catch` de dentro do seu serviço?**
* **Resposta Ideal:** "Relevando o Princípio da Responsabilidade Única (SOLID). O banco de dados e as regras de serviço quebram gerando instâncias de alto risco e vazadas do Data JPA e Jackson. Porém eu instanciei um Pattern Observer na minha API com uma camada chamada `@RestControllerAdvice`. Toda exceção da minha pilha é lançada para cima pra estourar naturalmente, sendo aparada pela luva do Controller Advice que reconhece pela Tipagem a falha (ex: `DataIntegrityViolationException`), e de volve um HTTP exato e protocolar formal blindando os metadados do meu stack-trace e do meu Banco contra seu acesso exploratório."
