
Os @ são anotações Java — metadados que o compilador ou o runtime do Spring leem e processam. Elas não são "texto no código", são instruções declarativas que ativam comportamentos automáticos.

Aqui está o mapeamento por categoria:
          
---                                                                                           
1. JPA / Hibernate — Mapeamento Objeto-Relacional (jakarta.persistence.*)

Dizem ao Spring/Hibernate como transformar classes Java em tabelas SQL.

┌───────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────┐   
│                             Anotação                              │                Onde aparece                 │                                             O que faz                                              │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @Entity                                                           │ Todas as 5 entidades                        │ Marca a classe como uma entidade JPA — cada instância vira uma linha no banco                      │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @Table(name = "...")                                              │ Carta, Colecao, Serie, Tipo,                │ Define o nome da tabela no banco (ex: cartas, colecoes)                                            │
│                                                                   │ DetalheEstatistica                          │                                                                                                    │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @Id                                                               │ Campo id de todas as entidades              │ Marca a chave primária (primary key)                                                               │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @GeneratedValue(strategy = IDENTITY)                              │ Campo id de todas as entidades              │ Auto-incremento — o banco gera o próximo ID                                                        │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @Enumerated(EnumType.STRING)                                      │ Carta.categoria                             │ Salva o nome do enum ("POKEMON") no banco, em vez de 0, 1...                                       │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @Column(unique = true)                                            │ Colecao.codigoExterno, Serie.idExterno,     │ Impede valores duplicados nessa coluna                                                             │
│                                                                   │ Tipo.nome                                   │                                                                                                    │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @ManyToOne                                                        │ Carta.colecao, Colecao.serie                │ N cartas → 1 coleção / N coleções → 1 série                                                        │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @JoinColumn(name = "...")                                         │ Em todos os @ManyToOne                      │ Define a coluna da FK (ex: colecao_id, serie_id)                                                   │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @OneToMany(mappedBy = "...", cascade = ALL, orphanRemoval = true) │ Colecao.cartas, Serie.colecoes              │ O lado inverso do @ManyToOne. cascade = ALL propaga operações (salvar/deletar). orphanRemoval =    │
│                                                                   │                                             │ true remove filhos órfãos                                                                          │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @OneToOne(mappedBy = "carta", cascade = ALL, orphanRemoval =      │ Carta.detalheEstatistica                    │ 1 carta → 1 detalhe                                                                                │
│ true)                                                             │                                             │                                                                                                    │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @OneToOne                                                         │ DetalheEstatistica.carta                    │ Lado dono da relação 1:1                                                                           │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @ManyToMany(mappedBy = "cartas")                                  │ Carta.tipos                                 │ N cartas ↔ N tipos (lado inverso)                                                                  │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @ManyToMany                                                       │ Tipo.cartas                                 │ N cartas ↔ N tipos (lado dono)                                                                     │
├───────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @JoinTable(name = "carta_tipo", joinColumns = ...,                │ Tipo.cartas                                 │ Cria a tabela intermediária carta_tipo com tipo_id + carta_id                                      │
│ inverseJoinColumns = ...)                                         │                                             │                                                                                                    │
└───────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
2. Bean Validation — Validação automática (jakarta.validation.*)

O Spring valida automaticamente os campos quando chega um @RequestBody.

┌────────────────────────────────────────────┬──────────────────────────┬────────────────────────────────────────────────────┐
│                  Anotação                  │         Exemplo          │                     O que faz                      │
├────────────────────────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────┤
│ @NotBlank(message = "...")                 │ Carta.nome, Colecao.nome │ String não pode ser nula, vazia ou só espaços      │
├────────────────────────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────┤
│ @NotNull(message = "...")                  │ Carta.categoria          │ Campo não pode ser null (serve para qualquer tipo) │
├────────────────────────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────┤
│ @Size(min = 1, max = 100, message = "...") │ Vários campos            │ Limita tamanho mínimo/máximo da string             │
└────────────────────────────────────────────┴──────────────────────────┴────────────────────────────────────────────────────┘

  ---
3. Spring Web — Controllers e Rotas (org.springframework.web.*)

Definem endpoints REST.

┌───────────────────────────────────────────────────────────┬───────────────────────────────┬────────────────────────────────────────────────────────────┐
│                         Anotação                          │             Onde              │                         O que faz                          │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @RestController                                           │ Todos os controllers          │ Marca como controller que retorna JSON (não template/HTML) │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @RequestMapping("/cartas")                                │ Todos os controllers          │ Prefixo da rota para todos os métodos                      │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @GetMapping / @PostMapping / @PutMapping / @DeleteMapping │ Métodos dos controllers       │ Mapeiam HTTP methods — GET /cartas, POST /cartas, etc.     │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @PathVariable                                             │ Parâmetros id, idExterno      │ Captura valor da URL (ex: /cartas/{id})                    │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @RequestParam                                             │ CartaController.buscarPorNome │ Captura query string (ex: ?nome=charizard)                 │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @RequestBody                                              │ Parâmetro de POST/PUT         │ Desserializa o JSON recebido em um objeto Java             │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @Valid                                                    │ Antes do @RequestBody         │ Ativa a validação do Bean Validation nos campos            │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @ResponseStatus(HttpStatus.OK)                            │ Alguns métodos                │ Define o status HTTP da resposta                           │
├───────────────────────────────────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────┤
│ @Autowired                                                │ Construtores dos controllers  │ Injeta dependências automaticamente                        │
└───────────────────────────────────────────────────────────┴───────────────────────────────┴────────────────────────────────────────────────────────────┘

  ---
4. Spring Boot — Configuração e Inicialização

┌──────────────────────────────────┬───────────────────────────┬────────────────────────────────────────────────────────────────────────────────┐
│             Anotação             │           Onde            │                                   O que faz                                    │
├──────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ @SpringBootApplication           │ PokemonTcgApplication     │ Sinaliza que é uma app Spring Boot — ativa auto-configuration + component scan │
├──────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ @EnableAsync                     │ PokemonTcgApplication     │ Habilita o processamento assíncrono (@Async para enriquecimento em background) │
├──────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ @Configuration                   │ DataLoader                │ Marca como classe de configuração Spring                                       │
├──────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ @Bean                            │ DataLoader.initDatabase() │ Registra o retorno do método como um bean gerenciado pelo Spring               │
├──────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ @Component                       │ TcgdexClient              │ Registra como bean automático para injeção                                     │
├──────────────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ @Value("${tcgdex.api.base-url}") │ TcgdexClient              │ Injeta valores do application.properties                                       │
└──────────────────────────────────┴───────────────────────────┴────────────────────────────────────────────────────────────────────────────────┘

  ---
5. Spring HATEOAS — Links nas respostas

┌─────────────────────────────────────────────────────┬─────────────┬─────────────────────────────────────────────────────────────────────────────────────────┐
│                      Anotação                       │     Uso     │                                        O que faz                                        │
├─────────────────────────────────────────────────────┼─────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
│ linkTo(methodOn(...).buscarPorId(id)).withSelfRel() │ Controllers │ Gera URLs absolutas como http://localhost:8080/cartas/1 e adiciona links _links ao JSON │
└─────────────────────────────────────────────────────┴─────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘

  ---
6. Spring Exception Handling

┌─────────────────────────────────┬────────────────────────┬───────────────────────────────────────────────────────────┐
│            Anotação             │          Onde          │                         O que faz                         │
├─────────────────────────────────┼────────────────────────┼───────────────────────────────────────────────────────────┤
│ @RestControllerAdvice           │ GlobalExceptionHandler │ Intercepta exceções de todos os controllers globalmente   │
├─────────────────────────────────┼────────────────────────┼───────────────────────────────────────────────────────────┤
│ @ExceptionHandler(Classe.class) │ Métodos do handler     │ Diz: "quando essa exceção acontecer, execute este método" │
└─────────────────────────────────┴────────────────────────┴───────────────────────────────────────────────────────────┘

  ---
7. Swagger / OpenAPI — Documentação automática

┌─────────────────────────────────────────────────────────┬────────────────────────┬────────────────────────────────────┐
│                        Anotação                         │          Onde          │             O que faz              │
├─────────────────────────────────────────────────────────┼────────────────────────┼────────────────────────────────────┤
│ @Tag(...)                                               │ Controllers            │ Agrupa endpoints no Swagger UI     │
├─────────────────────────────────────────────────────────┼────────────────────────┼────────────────────────────────────┤
│ @Operation(summary = "...", description = "...")        │ Todos os métodos       │ Documentação do endpoint           │
├─────────────────────────────────────────────────────────┼────────────────────────┼────────────────────────────────────┤
│ @ApiResponse(responseCode = "200", description = "...") │ Métodos                │ Documenta cada resposta possível   │
├─────────────────────────────────────────────────────────┼────────────────────────┼────────────────────────────────────┤
│ @ApiResponses({...})                                    │ Métodos                │ Agrupa múltiplas @ApiResponse      │
├─────────────────────────────────────────────────────────┼────────────────────────┼────────────────────────────────────┤
│ @Schema(description = "...", example = "...")           │ Entidades              │ Documenta campos no Swagger UI     │
├─────────────────────────────────────────────────────────┼────────────────────────┼────────────────────────────────────┤
│ @Parameter(description = "...", example = "...")        │ Parâmetros dos métodos │ Documenta parâmetros de query/path │
├─────────────────────────────────────────────────────────┼────────────────────────┼────────────────────────────────────┤
│ @ParameterObject                                        │ Pageable               │ Expande paginação na documentação  │
└─────────────────────────────────────────────────────────┴────────────────────────┴────────────────────────────────────┘

  ---
8. Jackson — Serialização JSON

┌─────────────┬───────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Anotação   │                                 Onde                                  │                                                     O que faz                                                     │
├─────────────┼───────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @JsonIgnore │ Serie.colecoes, Colecao.cartas, Carta.detalheEstatistica, Carta.tipos │ Evita loops infinitos na serialização JSON. Sem isso, Carta → Colecao → Serie → Colecao → ... travaria o servidor │
└─────────────┴───────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
Resumo visual do fluxo

@Entity + @Table     → Hibernate cria tabelas SQL automaticamente
@Id + @GeneratedValue → Auto-incremento do banco
@ManyToOne / @OneToMany / @ManyToMany / @JoinTable → Relacionamentos entre tabelas

@RestController + @GetMapping/@PostMapping → Endpoints REST
@Valid + @NotBlank/@NotNull/@Size          → Validação automática de dados
@ExceptionHandler + @RestControllerAdvice  → Tratamento global de erros

@Component / @Bean + @Autowired            → Injeção de dependências
@Configuration                             → Configuração Spring
@Value                                     → Leitura do application.properties

@Operation + @Schema + @ApiResponse        → Documentação Swagger/OpenAPI
@JsonIgnore                                → Previne loops na serialização JSON

@SpringBootApplication                     → Bootstrap da aplicação
@EnableAsync                               → Métodos assíncronos em background