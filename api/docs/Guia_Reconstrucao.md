# 🛠️ Como, Quando e Por Que: O Raio-X do seu Projeto

Esqueça analogias. Abaixo está a engenharia exata e fria de como você reconstrói o **SEU** código, lidando diretamente com os arquivos da sua máquina.

---

### Passo 1: O Ponto de Partida e Banco de Dados (`application.properties`)

**QUANDO (A Ordem):** É a primeira coisa que você digita depois de clonar um projeto vazio. Sem o banco de dados rodando, toda a sua aplicação Java falha já no segundo zero de inicialização.

**COMO (A Execução):** Você abre o arquivo `src/main/resources/application.properties` e preenche as coordenadas do banco H2 e do console.
```properties
spring.datasource.url=jdbc:h2:mem:pokemondb
spring.jpa.hibernate.ddl-auto=create-drop
spring.h2.console.enabled=true
```

**POR QUE (O Motivo):**
* Usamos `jdbc:h2:mem` para dizer ao Spring: *"O banco vai nascer e morrer na memória RAM toda vez que eu clicar em STOP no projeto, o que limpa a base para testes automáticos"*.
* Usamos `create-drop` para o Hibernate rastrear suas classes de `Entity` (como Carta e Colecao) e redigir o comando SQL `CREATE TABLE` sozinho toda vez que iniciar.
* Usamos `console.enabled=true` para você poder entrar na interface visual e debugar manualmente caso dê erro no backend.

---

### Passo 2: Os Contêineres de Dados da Nuvem (`TcgdexCartaDto.java`)

**QUANDO (A Ordem):** A segunda etapa é lidar com o recebimento da API do TCGdex. Antes de chamar a internet, você precisa criar o molde (DTO) do texto que vai vir da nuvem para o Java entender.

**COMO (A Execução):** Você cria o arquivo nativo `TcgdexCartaDto.java` formato record dentro da pasta `dto`.
```java
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexCartaDto(
        String id, String name, Integer hp
) {}
```

**POR QUE (O Motivo):**
* **Por que `record`?** Porque o JSON vindo do TCGdex é "somente leitura". Ninguém edita um JSON recebido; Records poupam você de digitar Getters e Setters, criando instâncias imutáveis.
* **Por que `@JsonIgnoreProperties`?** Porque a API TCGdex devolve 30 campos (ilustrador, raridade, flavor text, weakness). Você só quer usar 5. Se essa anotação não estiver aí, a biblioteca Jackson (que converte o texto puro em Java) veria campos sobrando e colapsaria informando um erro severo.

---

### Passo 3: O Motor de Chamadas Web (`TcgdexClient.java`)

**QUANDO (A Ordem):** Agora que o DTO existe, podemos ligar para a API do TCGdex e receber esse DTO populado.

**COMO (A Execução):** Criar `TcgdexClient.java` (marcado como `@Component`) isolando as linhas do RestClient. 
```java
    public TcgdexCartaDto buscarCartaPorId(String id) {
        return restClient.get().uri("/cards/{id}", id).retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Carta não encontrada na API TCGdex."); })
                .body(TcgdexCartaDto.class);
    }
```

**POR QUE (O Motivo):**
* **Por que isolamos isso?** Porque se a TCGdex mudar o formato da URL amanhã (exemplo: para `/v3`), nós alteramos apenas este aquivo, sem precisar re-compilar Controllers dezenas de vezes.
* **Por que `.onStatus()`?** Sem isso, se a Carta não existir (HTTP 404 da TCGdex), o RestClient vomita a Exception não tratada e o SEU servidor fica culpado com Status 500 no console. O `.onStatus` antecipa isso e cospe uma Runtime Exception sua (`TcgdexNaoEncontradoException`) limpando os rastros.

---

### Passo 4: O Célebro (`CartaService.java`)

**QUANDO (A Ordem):** Com o TCGdex conversando com você pela ferramenta *Client*, agora as Entidades de fato entram em cena. A arquitetura exige que o Service una as tabelas do Banco H2 com as respostas do Client.

**COMO (A Execução):** Cria-se a `CartaService.java`. Nela injetamos o Repositório e o TCGdex Client via Construtor.
```java
    public Carta importarDaTcgdex(String idExterno) {
        TcgdexCartaDto dto = tcgdexClient.buscarCartaPorId(idExterno);

        Carta carta = new Carta();
        carta.setIdExterno(dto.id());
        carta.setNome(dto.name());
        carta.setPontosDeVida(dto.hp());

        return cartaRepository.save(carta);
    }
```

**POR QUE (O Motivo):**
* **Por que pegar o DTO e passar pra uma variável chamada `Carta`?** Porque o banco de dados tem suas próprias regras rígidas (As Validações que criamos no `@Min(0)`). Se o Spring salvasse o DTO bruto da TCGdex, o banco poderia poluir seu projeto com dados estrangeiros sujos (como Cartas de Treinador possuindo HP ou Nomes vazios). Essa parte de "de-para" cruza do Ciberespaço e valida na porta do  Banco de Dados Local (`Repository`).

---

### Passo 5: A Rotearização Final (`CartaController.java`)

**QUANDO (A Ordem):** Nada existia publicamente no `/cartas` até este exato momento. A última coisa de um sistema back-end que você liga é o Controller, pois ele não compila se as `Services` não existirem para serem chamadas (Exigência do Spring).

**COMO (A Execução):** Marcamos a `CartaController.java` com `@RestController`.
```java
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<Carta>> buscarPorId(
            @PathVariable @Positive Long id) {
                
        Carta carta = cartaService.buscarPorId(id);
        EntityModel<Carta> model = EntityModel.of(carta,
                linkTo(methodOn(CartaController.class).buscarPorId(id)).withSelfRel());
                
        return ResponseEntity.ok(model);
    }
```

**POR QUE (O Motivo):**
* **Por que `@Positive Long id`?** Antes de sequer chegar na linha de `Carta carta =`, esse comando corta requisições de IDs como `-5` e devolve *HTTP 400*, protegendo idas e vindas ao banco atoa.
* **Por que `linkTo` e `withSelfRel()`?** É o que provê formalmente as diretivas de HATEOAS da sua estrutura de entrega. Ele converte na mosca o ID requisitado em um link final engatado ("`http://localhost:8080/cartas/2`") dentro do envelope JSON, prevenindo Front-Ends de precisarem codificar a URL da sua API de forma engessada no código deles.
