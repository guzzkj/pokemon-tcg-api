#  Pokémon TCG API RESTful

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green?style=for-the-badge&logo=spring)
![Java 17](https://img.shields.io/badge/Java-17+-orange?style=for-the-badge&logo=java)
![H2 Database](https://img.shields.io/badge/H2-Database-blue?style=for-the-badge&logo=sqlite)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-lightgrey?style=for-the-badge&logo=swagger)

Uma API RESTful desenvolvida inteiramente em **Java e Spring Boot** para gerenciar e catalogar Cartas, Coleções, Séries e Tipagens do universo de **Pokémon Trading Card Game**. Desenvolvida como parte de uma matéria de Web Services, visa colocar em prática técnicas maduras de arquitetura escalável e segurança no back-end.

##  Principais Features & Requisitos Atendidos

* **Separação Abstrata de Camadas:** MVC canônico utilizando as demarcações entre `Entities`, `Repositories`, `Services` e `Controllers`.
* **Banco de Dados Relacional:** Totalmente engatado num banco H2 em memória facilitando testes, possuindo relações estritas de Multiplicidade (`@OneToOne`, `@OneToMany` e `@ManyToMany`).
* **HATEOAS Glory:** Implementação purista do nível 3 de REST. Navegação facilitada com hyperlinks (`self`, `listar_todas`, etc) anexados dinamicamente nos payloads.
* **Segurança Anti-Crash & Graceful Degradation:** Controllers e ExceptionHandlers exaustivamente preparados para lidar com Injeção maliciosa e quebras de integridade que derrubariam a aplicação (Proteção contra Timeouts, TypeMismatch e Constraints Duplicadas com Códigos 400x nativos).
* **Consumo de API Externa Dinâmico:** Um dos endpoints consome ativamente a API pública do **TCGdex** via `RestClient` do Spring.  

##  Estrutura do Domínio e Endpoints

Temos exatas 5 entidades vitais mapeadas:
1. `Cartas`
2. `Colecoes`
3. `Series`
4. `Tipos`
5. `DetalheEstatistica`

Todas operam sob o padrão HTTP Verbs para CRUD Completo, com a adição obrigatória de **Buscas Paginadas** (`?page=0&size=10`) e rotas extras como `/buscar?nome=X`.

##  Como Iniciar a Aplicação

Este projeto é autocontido e fácil de avaliar. Não requer softwares pesados ou bancos separados rodando na sua máquina.

1. Clone o repositório ou baixe o código.
2. Na raiz do projeto, abra um terminal e rode através do **Maven Wrapper**:
   * No Windows: `mvnw.cmd spring-boot:run`
   * No Linux/Mac: `./mvnw spring-boot:run`
3. Após o Tomcat indicar *Started on port 8080*, a API estará de pé!

##  Documentação Interativa 

Esta API possui uma UI belíssima e guiada construída com o Swagger no padrão OpenAPI3. Todos os schemas e payloads de requisição estão expostos lá.

Acesse: **[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**

## Importando a Coleção no Postman

É testador? A forma mais fácil de testar todos os cenários sem precisar montar JSON a JSON no Postman é usando nosso schema automático:

1. Abra seu Postman.
2. Clique no botão de **"Import"**.
3. Selecione a aba "Link" / "URL".
4. Cole o link do schema bruto gerado nativamente pela nossa API rodando: `http://localhost:8080/v3/api-docs`
5. O Postman gerará instantaneamente todas as pastas e rotas baseadas na nossa documentação. Divirta-se!
