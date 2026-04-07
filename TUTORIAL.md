# Tutorial: Como criar uma API RESTful com Spring Boot do zero

> Guia passo a passo para recriar o projeto Pokémon TCG API.  
> Disciplina de Web Services — SENAC TSI

---

## Pré-requisitos

Antes de começar, você precisa ter instalado:

| Ferramenta | Versão | Para quê serve |
|---|---|---|
| JDK | 25+ | Compilar e rodar Java |
| Maven | 3.9+ | Gerenciar dependências e build |
| IntelliJ IDEA | Qualquer | IDE (recomendada) |
| Postman ou Bruno | Qualquer | Testar os endpoints |

---

## Passo 1 — Criar o projeto no Spring Initializr

Acesse [start.spring.io](https://start.spring.io) e configure assim:

| Campo | Valor |
|---|---|
| **Project** | Maven |
| **Language** | Java |
| **Spring Boot** | 4.0.x (mais recente) |
| **Group** | `senac.tsi` |
| **Artifact** | `pokemon-tcg` |
| **Packaging** | Jar |
| **Java** | 25 |

### Dependências para adicionar (clique em "Add Dependencies"):

- **Spring Web** → cria os endpoints REST (`@RestController`)
- **Spring Data JPA** → comunicação com banco de dados via repositórios
- **H2 Database** → banco de dados em memória (sem instalar nada)
- **Spring HATEOAS** → adiciona links de navegação nas respostas
- **Lombok** → reduz código repetitivo (getters, setters)

Clique em **GENERATE**, descompacte o ZIP e abra no IntelliJ.

---

## Passo 2 — Adicionar dependências extras no pom.xml

Abra o arquivo `pom.xml` e adicione dentro de `<dependencies>`:

```xml
<!-- Bean Validation: ativa @NotBlank, @NotNull, @Size nas entidades -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Springdoc OpenAPI: gera a documentação Swagger automaticamente -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>3.0.2</version>
</dependency>
```

> **Por que essas duas?**  
> O Initializr não inclui Validation e Springdoc por padrão.  
> Sem Validation, os `@NotBlank` nas entidades são ignorados.  
> Sem Springdoc, o Swagger não funciona.

---

## Passo 3 — Configurar o application.properties

Abra `src/main/resources/application.properties` e substitua pelo conteúdo abaixo:

```properties
spring.application.name=pokemon-tcg-api

# H2 — banco em memória (recriado a cada restart)
spring.datasource.url=jdbc:h2:mem:pokemondb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA / Hibernate
spring.jpa.show-sql=true
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

# Console do H2 — acesse em http://localhost:8080/h2-console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Swagger — acesse em http://localhost:8080/swagger-ui.html
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html

# URL da API externa TCGdex (sempre com /pt-br/)
tcgdex.api.base-url=https://api.tcgdex.net/v2/pt-br
```

> **Dica:** `ddl-auto=create-drop` faz o Hibernate criar as tabelas  
> automaticamente com base nas suas entidades `@Entity`.  
> Em produção usaríamos `validate` ou `none`.

---

## Passo 4 — Criar a estrutura de pacotes

Dentro de `src/main/java/senac/tsi/pokemontcg/`, crie os seguintes pacotes  
(pastas) no IntelliJ (clique direito → New → Package):

```
senac.tsi.pokemontcg
├── controllers      ← recebe as requisições HTTP
├── entities         ← classes que viram tabelas no banco
├── enums            ← tipos enumerados
├── exceptions       ← erros personalizados
├── infrastructure   ← configurações técnicas
├── repositories     ← acesso ao banco de dados
├── services         ← regras de negócio
└── tcgdex
    └── dto          ← objetos de transferência da API externa
```

> **Por que essa estrutura?**  
> É a arquitetura em camadas padrão (Layered Architecture).  
> Cada camada tem uma responsabilidade única:  
> Controller → recebe; Service → processa; Repository → persiste.

---

## Passo 5 — Criar o Enum

**Por que primeiro o Enum?** Porque a entidade `Carta` depende dele.

Crie `enums/CategoriaCartaEnum.java`:

```java
package senac.tsi.pokemontcg.enums;

public enum CategoriaCartaEnum {

    POKEMON("Pokémon"),
    TREINADOR("Treinador"),
    ENERGIA("Energia");

    private final String descricao;

    CategoriaCartaEnum(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    // Converte o texto da API externa para o enum
    public static CategoriaCartaEnum fromTexto(String texto) {
        if (texto == null) return POKEMON;
        return switch (texto.toLowerCase()) {
            case "pokemon", "pokémon" -> POKEMON;
            case "trainer", "treinador" -> TREINADOR;
            case "energy", "energia" -> ENERGIA;
            default -> POKEMON;
        };
    }
}
```

---

## Passo 6 — Criar as Entidades

> **Conceito:** Uma entidade `@Entity` é uma classe Java que o JPA/Hibernate  
> converte automaticamente em uma tabela no banco de dados.  
> Cada campo vira uma coluna; cada instância vira uma linha.

### Ordem de criação (respeite as dependências):

```
1. Colecao        (não depende de ninguém)
2. Carta          (depende de Colecao)
3. DetalheEstatistica  (depende de Carta)
4. Tipo           (depende de Carta via Many-to-Many)
5. Deck           (depende de Carta via Many-to-Many)
```

### 6.1 — Entidade Colecao

```java
package senac.tsi.pokemontcg.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "colecoes")
public class Colecao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 50)
    @Column(unique = true)
    private String codigoExterno;  // ex: "base1"

    @NotBlank(message = "O nome da coleção é obrigatório")
    @Size(min = 1, max = 100)
    private String nome;

    @Size(max = 100)
    private String serie;

    @Size(max = 500)
    private String logoUrl;

    private Integer totalDeCartas;

    // @JsonIgnore evita loop infinito na serialização:
    // Colecao → Carta → Colecao → Carta → ...
    @JsonIgnore
    @OneToMany(mappedBy = "colecao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Carta> cartas = new ArrayList<>();

    // Construtor vazio obrigatório para o JPA
    public Colecao() {}

    // Getters e Setters (gere com Alt+Insert no IntelliJ)
}
```

> **Anotações explicadas:**
> - `@Entity` → esta classe é uma tabela no banco
> - `@Table(name = "colecoes")` → define o nome da tabela (opcional)
> - `@Id` → esta é a chave primária
> - `@GeneratedValue(IDENTITY)` → o banco gera o ID automaticamente (auto_increment)
> - `@Column(unique = true)` → garante que não haverá dois registros iguais nessa coluna
> - `@NotBlank` → valida que o campo não é nulo nem vazio (Bean Validation)
> - `@OneToMany` → uma Coleção tem muitas Cartas
> - `mappedBy = "colecao"` → diz que a FK está na tabela Carta (não aqui)
> - `cascade = CascadeType.ALL` → operações na Coleção se propagam para as Cartas
> - `orphanRemoval = true` → remover a relação remove a Carta do banco

---

### 6.2 — Entidade Carta (a mais importante)

```java
package senac.tsi.pokemontcg.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import senac.tsi.pokemontcg.enums.CategoriaCartaEnum;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cartas")
public class Carta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 50)
    private String idExterno;   // ex: "base1-4"

    @Size(max = 20)
    private String numeroLocal; // ex: "4"

    @NotBlank(message = "O nome da carta é obrigatório")
    @Size(min = 1, max = 100)
    private String nome;

    @Size(max = 500)
    private String imagemUrl;

    // @Enumerated(STRING) salva "POKEMON" em vez do índice numérico "0"
    // NUNCA use EnumType.ORDINAL — se reordenar o enum, os dados corrompem
    @NotNull(message = "A categoria da carta é obrigatória")
    @Enumerated(EnumType.STRING)
    private CategoriaCartaEnum categoria;

    private Integer pontosDeVida;

    // Muitas Cartas pertencem a uma Coleção — FK "colecao_id" fica aqui
    @ManyToOne
    @JoinColumn(name = "colecao_id")
    private Colecao colecao;

    // mappedBy="carta" significa que DetalheEstatistica é dono da FK
    @JsonIgnore
    @OneToOne(mappedBy = "carta", cascade = CascadeType.ALL, orphanRemoval = true)
    private DetalheEstatistica detalheEstatistica;

    // @JsonIgnore evita loop: Carta → Tipo → Carta → Tipo → ...
    @JsonIgnore
    @ManyToMany(mappedBy = "cartas")
    private List<Tipo> tipos = new ArrayList<>();

    @JsonIgnore
    @ManyToMany(mappedBy = "cartas")
    private List<Deck> decks = new ArrayList<>();

    public Carta() {}

    // Getters e Setters
}
```

---

### 6.3 — Entidade DetalheEstatistica (One-to-One)

```java
package senac.tsi.pokemontcg.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "detalhes_estatisticas")
public class DetalheEstatistica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 100)
    private String raridade;   // ex: "Rare Holo"

    @Size(max = 100)
    private String artista;    // ex: "Mitsuhiro Arita"

    @Size(max = 1000)
    private String descricao;  // flavor text da carta

    @Size(max = 100)
    private String evolucaoDe; // ex: "Charmeleon"

    // Este lado é o "dono" do relacionamento — a FK "carta_id" fica AQUI
    // unique = true garante que uma Carta só tenha um DetalheEstatistica
    @OneToOne
    @JoinColumn(name = "carta_id", unique = true)
    private Carta carta;

    public DetalheEstatistica() {}

    // Getters e Setters
}
```

> **One-to-One explicado:**  
> Em um relacionamento 1:1, um dos lados precisa guardar a FK.  
> Aqui, `DetalheEstatistica` guarda `carta_id`.  
> Na entidade `Carta`, usamos `mappedBy = "carta"` para indicar  
> que ela é o lado "inverso" (não guarda a FK).

---

### 6.4 — Entidade Tipo (Many-to-Many com Carta)

```java
package senac.tsi.pokemontcg.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tipos")
public class Tipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome do tipo é obrigatório")
    @Size(min = 1, max = 50)
    @Column(unique = true)
    private String nome; // ex: "Fogo", "Água"

    // @JoinTable define a tabela intermediária "carta_tipo"
    // que terá as colunas: tipo_id e carta_id
    @ManyToMany
    @JoinTable(
        name = "carta_tipo",
        joinColumns = @JoinColumn(name = "tipo_id"),
        inverseJoinColumns = @JoinColumn(name = "carta_id")
    )
    private List<Carta> cartas = new ArrayList<>();

    public Tipo() {}

    // Getters e Setters
}
```

> **Many-to-Many explicado:**  
> Uma Carta pode ter vários Tipos (Fogo + Dragão).  
> Um Tipo agrupa várias Cartas.  
> O banco precisa de uma **tabela intermediária** para isso.  
> `@JoinTable` cria essa tabela automaticamente.  
> Tipo é o lado "dono" (define o `@JoinTable`).  
> Carta usa `mappedBy = "cartas"` (é o lado inverso).

---

### 6.5 — Entidade Deck (Many-to-Many com Carta)

```java
package senac.tsi.pokemontcg.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "decks")
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome do deck é obrigatório")
    @Size(min = 1, max = 100)
    private String nome;

    @NotBlank(message = "O nome do jogador é obrigatório")
    @Size(min = 1, max = 100)
    private String jogadorNome;

    @Size(max = 500)
    private String descricao;

    @ManyToMany
    @JoinTable(
        name = "deck_carta",
        joinColumns = @JoinColumn(name = "deck_id"),
        inverseJoinColumns = @JoinColumn(name = "carta_id")
    )
    private List<Carta> cartas = new ArrayList<>();

    public Deck() {}

    // Getters e Setters
}
```

---

## Passo 7 — Criar os Repositórios

> **Conceito:** O repositório é a camada que fala com o banco de dados.  
> Ao estender `JpaRepository<Entidade, TipoDoId>`, você herda gratuitamente:  
> `findAll()`, `findById()`, `save()`, `deleteById()`, `existsById()`, etc.  
> Os "query methods" são métodos cujo nome o Spring Data JPA converte  
> automaticamente em SQL — sem você escrever uma linha de SQL.

Crie um arquivo para cada entidade dentro do pacote `repositories`:

```java
// CartaRepository.java
package senac.tsi.pokemontcg.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import senac.tsi.pokemontcg.entities.Carta;

@Repository
public interface CartaRepository extends JpaRepository<Carta, Long> {

    // "findBy" + "Nome" + "Containing" + "IgnoreCase"
    // Spring gera: SELECT * FROM cartas WHERE LOWER(nome) LIKE LOWER('%nome%')
    Page<Carta> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    // Spring navega pelo relacionamento: Carta → colecao → id
    // Gera: SELECT * FROM cartas WHERE colecao_id = ?
    Page<Carta> findByColecaoId(Long colecaoId, Pageable pageable);
}
```

> **Padrão dos query methods:**  
> `findBy` + `NomeDoCampo` + `Operação`  
> Operações comuns: `Containing`, `IgnoreCase`, `Between`, `LessThan`, `OrderBy`  
> Exemplo: `findByNomeContainingIgnoreCaseOrderByNomeAsc`

Repita o padrão para os demais repositórios (`ColecaoRepository`, `DetalheEstatisticaRepository`, `TipoRepository`, `DeckRepository`), adicionando os query methods personalizados de cada um.

---

## Passo 8 — Criar os DTOs da TCGdex

> **Conceito:** DTO (Data Transfer Object) é um objeto simples usado para  
> receber/enviar dados de/para uma API externa. Usamos `record` do Java  
> por ser imutável e compacto — perfeito para representar dados de terceiros.  
> `@JsonIgnoreProperties(ignoreUnknown = true)` impede erros quando a API  
> externa retorna campos que não mapeamos.

```java
// TcgdexCartaResumidaDto.java — retornado na listagem
package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexCartaResumidaDto(
    String id,
    String localId,
    String name,
    String image
) {}
```

```java
// TcgdexCartaDto.java — retornado no detalhe de uma carta
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexCartaDto(
    String id,
    String localId,
    String name,
    String image,
    String category,
    String illustrator,
    String rarity,
    String description,
    Integer hp,
    List<String> types,
    String evolveFrom,
    TcgdexColecaoResumidaDto set
) {}
```

Crie também: `TcgdexColecaoResumidaDto`, `TcgdexColecaoDto`, `TcgdexCardCountDto`.

---

## Passo 9 — Criar o TcgdexClient

> **Conceito:** O `RestClient` (Spring 6.1+) é o cliente HTTP moderno do Spring.  
> Substitui o `RestTemplate` legado. Usa uma API fluente (encadeamento de métodos).  
> O `.onStatus()` intercepta respostas de erro antes de tentar desserializar o corpo,  
> permitindo lançar nossas exceções personalizadas.

Primeiro, crie a configuração em `infrastructure/RestClientConfig.java`:

```java
package senac.tsi.pokemontcg.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}
```

Depois, crie `tcgdex/TcgdexClient.java`:

```java
package senac.tsi.pokemontcg.tcgdex;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import senac.tsi.pokemontcg.exceptions.ErroIntegracaoExternaException;
import senac.tsi.pokemontcg.exceptions.TcgdexNaoEncontradoException;
// ... outros imports

@Component
public class TcgdexClient {

    private final RestClient restClient;

    // @Value injeta o valor da propriedade do application.properties
    public TcgdexClient(RestClient.Builder builder,
                        @Value("${tcgdex.api.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public TcgdexCartaDto buscarCartaPorId(String id) {
        return restClient.get()
                .uri("/cards/{id}", id)          // monta a URL
                .retrieve()                       // executa a requisição
                .onStatus(
                    status -> status.value() == 404,
                    (req, resp) -> { throw new TcgdexNaoEncontradoException(
                        "Carta '" + id + "' não encontrada na TCGdex."); })
                .onStatus(
                    status -> status.is5xxServerError(),
                    (req, resp) -> { throw new ErroIntegracaoExternaException(
                        "Falha ao comunicar com a TCGdex."); })
                .body(TcgdexCartaDto.class);     // desserializa o JSON
    }

    public List<TcgdexCartaResumidaDto> listarCartas() {
        return restClient.get()
                .uri("/cards")
                .retrieve()
                .onStatus(/* ... */)
                // ParameterizedTypeReference preserva o tipo genérico List<T>
                // em tempo de execução (Java apaga generics por padrão)
                .body(new ParameterizedTypeReference<List<TcgdexCartaResumidaDto>>() {});
    }

    // Repita o padrão para listarColecoes() e buscarColecaoPorId()
}
```

---

## Passo 10 — Criar as Exceções

> **Conceito:** Criar exceções personalizadas deixa o código mais legível  
> e permite que o `@ControllerAdvice` trate cada tipo de erro diferente.  
> Extendemos `RuntimeException` para que não precisemos declará-las com `throws`.

```java
// RecursoNaoEncontradoException.java — para erros no nosso banco
public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String mensagem) { super(mensagem); }
}

// TcgdexNaoEncontradoException.java — para 404 da API externa
public class TcgdexNaoEncontradoException extends RuntimeException {
    public TcgdexNaoEncontradoException(String mensagem) { super(mensagem); }
}

// ErroIntegracaoExternaException.java — para 5xx da API externa
public class ErroIntegracaoExternaException extends RuntimeException {
    public ErroIntegracaoExternaException(String mensagem) { super(mensagem); }
}
```

Crie o record para padronizar as respostas de erro:

```java
// ErrorResponse.java
public record ErrorResponse(int status, String erro, String mensagem) {}
```

---

## Passo 11 — Criar o GlobalExceptionHandler

> **Conceito:** `@RestControllerAdvice` é um interceptador global.  
> Qualquer exceção lançada em qualquer Controller passa por aqui antes  
> de chegar ao cliente. Isso centraliza o tratamento de erros — sem  
> try/catch espalhados pelo código.  
> O Spring usa o `@ExceptionHandler` mais **específico** disponível.

```java
package senac.tsi.pokemontcg.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Recurso não encontrado no NOSSO banco → HTTP 404
    @ExceptionHandler(RecursoNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNaoEncontrado(RecursoNaoEncontradoException ex) {
        return new ErrorResponse(404, "Recurso não encontrado", ex.getMessage());
    }

    // Recurso não encontrado na TCGdex → HTTP 404
    @ExceptionHandler(TcgdexNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleTcgdexNaoEncontrado(TcgdexNaoEncontradoException ex) {
        return new ErrorResponse(404, "Não encontrado na TCGdex", ex.getMessage());
    }

    // Falha de comunicação com a TCGdex → HTTP 500
    @ExceptionHandler(ErroIntegracaoExternaException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleIntegracao(ErroIntegracaoExternaException ex) {
        return new ErrorResponse(500, "Erro de integração com TCGdex", ex.getMessage());
    }

    // Validação falhou (@NotBlank, @Size, etc.) → HTTP 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidacao(MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return new ErrorResponse(400, "Dados inválidos", mensagem);
    }

    // Qualquer outra exceção não tratada → HTTP 500
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGenerico(Exception ex) {
        return new ErrorResponse(500, "Erro interno", ex.getMessage());
    }
}
```

---

## Passo 12 — Criar os Services

> **Conceito:** O Service é a camada de **regras de negócio**.  
> Ele não sabe nada sobre HTTP (isso é papel do Controller).  
> Ele não sabe nada sobre SQL (isso é papel do Repository).  
> Sua única responsabilidade é coordenar o fluxo de dados.  
> `@Transactional` garante que todas as operações do método  
> sejam executadas juntas — ou nenhuma (rollback automático em caso de erro).

```java
package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.exceptions.RecursoNaoEncontradoException;
import senac.tsi.pokemontcg.repositories.CartaRepository;
import senac.tsi.pokemontcg.tcgdex.TcgdexClient;

@Service
@Transactional
public class CartaService {

    private final CartaRepository cartaRepository;
    private final TcgdexClient tcgdexClient;

    @Autowired  // Spring injeta as dependências automaticamente (Injeção de Dependência)
    public CartaService(CartaRepository cartaRepository, TcgdexClient tcgdexClient) {
        this.cartaRepository = cartaRepository;
        this.tcgdexClient = tcgdexClient;
    }

    @Transactional(readOnly = true)  // Otimização: Hibernate não rastreia mudanças
    public Page<Carta> listarTodas(Pageable pageable) {
        return cartaRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Carta buscarPorId(Long id) {
        // orElseThrow: se não encontrar, lança a exceção → GlobalExceptionHandler retorna 404
        return cartaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Carta com id " + id + " não encontrada."));
    }

    public Carta criar(Carta carta) {
        return cartaRepository.save(carta);  // save() com ID null → INSERT
    }

    public Carta atualizar(Long id, Carta dados) {
        Carta carta = buscarPorId(id);       // lança 404 se não existir
        carta.setNome(dados.getNome());
        carta.setCategoria(dados.getCategoria());
        // ... outros campos
        return cartaRepository.save(carta);  // save() com ID existente → UPDATE
    }

    public void deletar(Long id) {
        if (!cartaRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Carta com id " + id + " não encontrada.");
        }
        cartaRepository.deleteById(id);
    }

    public Carta importarDaTcgdex(String idExterno) {
        var dto = tcgdexClient.buscarCartaPorId(idExterno); // pode lançar TcgdexNaoEncontradoException
        Carta carta = new Carta();
        carta.setIdExterno(dto.id());
        carta.setNome(dto.name());
        carta.setCategoria(CategoriaCartaEnum.fromTexto(dto.category()));
        carta.setPontosDeVida(dto.hp());
        carta.setImagemUrl(dto.image() != null ? dto.image() + "/high.png" : null);
        return cartaRepository.save(carta);
    }
}
```

Repita o padrão para `ColecaoService`, `DetalheEstatisticaService`, `TipoService` e `DeckService`.

---

## Passo 13 — Criar os Controllers

> **Conceito:** O Controller é a porta de entrada da sua API.  
> Ele recebe a requisição HTTP, chama o Service e devolve a resposta.  
> Com HATEOAS, cada resposta inclui `_links` que ensinam o cliente  
> quais operações ele pode fazer a seguir (navegabilidade REST nível 3).  
> `Pageable` recebe automaticamente `?page=0&size=10&sort=nome,asc` da URL.

```java
package senac.tsi.pokemontcg.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.services.CartaService;
import java.net.URI;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Tag(name = "Cartas", description = "CRUD de cartas Pokémon TCG")
@RestController
@RequestMapping("/cartas")
public class CartaController {

    private final CartaService cartaService;
    private final PagedResourcesAssembler<Carta> pagedAssembler;

    @Autowired
    public CartaController(CartaService cartaService,
                           PagedResourcesAssembler<Carta> pagedAssembler) {
        this.cartaService = cartaService;
        this.pagedAssembler = pagedAssembler;
    }

    @Operation(summary = "Lista todas as cartas com paginação")
    @GetMapping
    public ResponseEntity<PagedModel<EntityModel<Carta>>> listarTodas(
            @ParameterObject Pageable pageable) {           // ← recebe ?page=0&size=10
        Page<Carta> cartas = cartaService.listarTodas(pageable);
        // pagedAssembler converte Page<Carta> → PagedModel com _links de navegação
        PagedModel<EntityModel<Carta>> model = pagedAssembler.toModel(cartas,
                carta -> EntityModel.of(carta,
                        linkTo(methodOn(CartaController.class)
                            .buscarPorId(carta.getId())).withSelfRel()));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Busca uma carta por ID")
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<Carta>> buscarPorId(@PathVariable Long id) {
        Carta carta = cartaService.buscarPorId(id);
        // EntityModel.of() embrulha a entidade e adiciona os _links
        EntityModel<Carta> model = EntityModel.of(carta,
                linkTo(methodOn(CartaController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(CartaController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"),
                linkTo(methodOn(CartaController.class).atualizar(id, null)).withRel("atualizar"),
                linkTo(methodOn(CartaController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Cria uma nova carta")
    @PostMapping
    public ResponseEntity<EntityModel<Carta>> criar(@Valid @RequestBody Carta carta) {
        // @Valid aciona o Bean Validation (@NotBlank, @Size, etc.)
        Carta salva = cartaService.criar(carta);
        EntityModel<Carta> model = EntityModel.of(salva,
                linkTo(methodOn(CartaController.class).buscarPorId(salva.getId())).withSelfRel());
        // HTTP 201 Created + Location header apontando para o novo recurso
        return ResponseEntity.created(URI.create("/cartas/" + salva.getId())).body(model);
    }

    @Operation(summary = "Atualiza uma carta existente")
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<Carta>> atualizar(@PathVariable Long id,
                                                         @Valid @RequestBody Carta carta) {
        Carta atualizada = cartaService.atualizar(id, carta);
        return ResponseEntity.ok(EntityModel.of(atualizada,
                linkTo(methodOn(CartaController.class).buscarPorId(id)).withSelfRel()));
    }

    @Operation(summary = "Remove uma carta")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        cartaService.deletar(id);
        return ResponseEntity.noContent().build(); // HTTP 204 — sem corpo na resposta
    }

    @Operation(summary = "Busca cartas por nome")
    @GetMapping("/buscar")
    public ResponseEntity<PagedModel<EntityModel<Carta>>> buscarPorNome(
            @RequestParam String nome, @ParameterObject Pageable pageable) {
        Page<Carta> cartas = cartaService.buscarPorNome(nome, pageable);
        return ResponseEntity.ok(pagedAssembler.toModel(cartas,
                c -> EntityModel.of(c,
                        linkTo(methodOn(CartaController.class).buscarPorId(c.getId())).withSelfRel())));
    }

    @Operation(summary = "Importa uma carta da TCGdex para o banco local")
    @PostMapping("/importar/{idExterno}")
    public ResponseEntity<EntityModel<Carta>> importarDaTcgdex(@PathVariable String idExterno) {
        Carta importada = cartaService.importarDaTcgdex(idExterno);
        return ResponseEntity.created(URI.create("/cartas/" + importada.getId()))
                .body(EntityModel.of(importada,
                        linkTo(methodOn(CartaController.class).buscarPorId(importada.getId())).withSelfRel()));
    }
}
```

Repita o padrão para os demais controllers (`ColecaoController`, `DetalheEstatisticaController`, `TipoController`, `DeckController`, `TcgdexController`).

---

## Passo 14 — Configurar o OpenAPI (Swagger)

Edite `infrastructure/OpenApiConfig.java`:

```java
package senac.tsi.pokemontcg.infrastructure;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.*;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Pokémon TCG API",
        version = "1.0.0",
        description = "API RESTful para gerenciamento de cartas Pokémon TCG — SENAC TSI",
        contact = @Contact(name = "SENAC TSI", email = "webservices@senac.br")
    )
)
public class OpenApiConfig {}
```

---

## Passo 15 — Verificar e Rodar

### Verificação final do pom.xml

Confirme que você tem estas dependências:

```xml
<dependencies>
    <dependency>spring-boot-starter-web / spring-boot-starter-webmvc</dependency>
    <dependency>spring-boot-starter-data-jpa</dependency>
    <dependency>spring-boot-starter-hateoas</dependency>
    <dependency>spring-boot-starter-validation</dependency>
    <dependency>spring-boot-h2console (ou h2)</dependency>
    <dependency>springdoc-openapi-starter-webmvc-ui 3.0.2</dependency>
    <dependency>lombok (optional)</dependency>
</dependencies>
```

### Rodando o projeto

No IntelliJ, clique em **Run** na classe `PokemonTcgApplication`.  
Ou pelo terminal:

```bash
./mvnw spring-boot:run
```

### URLs disponíveis após subir

| URL | O que é |
|---|---|
| `http://localhost:8080/swagger-ui.html` | Documentação interativa (Swagger) |
| `http://localhost:8080/h2-console` | Console do banco H2 |
| `http://localhost:8080/cartas` | Lista cartas (nossa API) |
| `http://localhost:8080/tcgdex/cartas` | Lista cartas (proxy TCGdex) |

### Testando no Swagger

1. Acesse `http://localhost:8080/swagger-ui.html`
2. Expanda a seção **Cartas**
3. Clique em `POST /cartas/importar/{idExterno}`
4. Clique em **Try it out**
5. Digite `base1-4` no campo `idExterno`
6. Clique em **Execute**
7. Verifique que o Charizard foi salvo → acesse `GET /cartas/1`

---

## Resumo dos conceitos aprendidos

| Conceito | Onde aparece | Para quê serve |
|---|---|---|
| `@Entity` + `@Id` | Entidades | Define tabelas e chaves primárias |
| `@OneToMany` / `@ManyToOne` | Colecao ↔ Carta | Relacionamento 1:N |
| `@OneToOne` | Carta ↔ DetalheEstatistica | Relacionamento 1:1 |
| `@ManyToMany` + `@JoinTable` | Carta ↔ Tipo / Deck | Relacionamento N:N |
| `@Enumerated(STRING)` | Carta.categoria | Salva nome do enum, não o índice |
| `@JsonIgnore` | Listas bidirecionais | Evita loop infinito no JSON |
| `@NotBlank` / `@NotNull` / `@Size` | Entidades | Validação automática |
| `@RestControllerAdvice` | GlobalExceptionHandler | Centraliza tratamento de erros |
| `JpaRepository` | Repositórios | CRUD gratuito + query methods |
| `Page<T>` + `Pageable` | Controllers e Services | Paginação automática |
| `EntityModel` + `PagedModel` | Controllers | HATEOAS — links de navegação |
| `RestClient` | TcgdexClient | Cliente HTTP moderno |
| `@Transactional` | Services | Garante consistência no banco |
| `@Value` | TcgdexClient | Injeta propriedades do .properties |
| `record` | DTOs | Objeto imutável e compacto |

---

*Tutorial gerado como material de apoio para a disciplina de Web Services — SENAC TSI.*
