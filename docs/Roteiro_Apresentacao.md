# 🎙️ Roteiro da Apresentação do Projeto (Aprovadíssimo!)

**Objetivo:** Este documento de rascunho te guia para gastar seu tempo de forma impressionante e técnica durante sua apresentação. Ao invés de você ficar narrando código linha por linha, você deve mostrar "Visão de Arquiteto".

---

### Passo 1: O "Pitch" Inicial (Abertura / 1-2 minutos)
* **O que falar:** Comece contando brevemente sobre o domínio que escolheu (Pokémon TCG) e venda o alicerce sólido da sua aplicação. Mencione que você priorizou construir algo o mais tolerante a falhas possível e que implementou todos os requisitos estritos sem gambiarras.
* **O que mostrar:** Mostre sua IDE e abra pacotes/pastas só para mostrar a arquitetura limpa (A hierarquia de `controllers`, `services`, `exceptions` etc). 

### Passo 2: Os Pilares do Domínio (2-3 minutos)
* **O que falar:** Mostre como as coisas se relacionam e os diferenciais. "Prof., usei as exatas 5 tabelas requisitadas e cruzei todas as cardinalidades". Destaque que a Entidade de `Carta` tem tanto `OneToMany` com a coleção, `ManyToMany` com Tipos quanto `OneToOne` limitando Estatísticas únicas.
* **O que mostrar:** Deixe o código da classe `Carta.java` de fundo na tela mostrando as anotações do `@ManyToOne`, e se destaque citando que usa anotações para forçar restrições lá dentro.

### Passo 3: O Ponto Alto - O Swagger e a Resiliência (3-5 Minutos)
* **O que falar:** É muito comum APIs de faculdade não serem bem documentadas e travarem com inputs inválidos. Informe com orgulho as defesas que seu sistema possuí: "Minha documentação utiliza extensivamente o `@Operation`, mas minha carta na manga é o Exception Handler."
* **O que mostrar:** 
   1. Abra o navegador na página: `http://localhost:8080/swagger-ui.html`. Mostre como o design está descritivo.
   2. **Truque Mágico:** Ali mesmo no Swagger (ou no Postman se já puxou a API pra lá), tenta inventar um ID negativo (`-1`) no teste do endpoint ou tente pesquisar com a letra "`_`" curinga. Mostre de forma pomposa que seu código não retornou a medonha tela de erro do *Tomcat (500 Internal Server)*, mas sim códigos RESTFul elegantes e descritivamente sadios (`400 Bad Request` ou `409 Conflict`).

### Passo 4: Diferencial do HATEOAS (1 Minuto)
* **O que falar:** Puxe destaque para o uso da biblioteca do HATEOAS. "Diferente de requisições engessadas, optei por usar `PagedResourcesAssembler` que embutem hiperlinks automáticos no meu JSON".
* **O que mostrar:** Foca num retorno de um JSON qualquer e mostra os links embutidos de `_links: {"self" : ..., "listar_todas": ...}` no fim do payload.

### Passo 5: A Cereja do Bolo - A Rota Customizada (Encerramento)
* **O que falar:** Diga que a principal rota do seu ecossistema não é um CRUD burro, mas sim que utiliza o Client integrado ao ecossistema do Spring como uma API Gateway!
* **O que mostrar:** Abra o endpoint customizado `/importar` mostrando que ele se conecta no `TCGdex API` remotamente e engole para o seu banco H2 as cartas puxadas ao vivo sem interferência, citando também que você implantou um poderoso "Timeout" no `RestClientConfig` para garantir que se a web estiver fora do ar sua máquina nunca sofrerá exaustão.

---

**Dica Final de Ouro:** Não leia os slides. Use os tópicos apenas como cordão. Mostre mais as testagens reais do código rodando nos consoles em vez de ficar passeando o mouse pelas linhas escritas. Boa Sorte!
