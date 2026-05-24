package senac.tsi.pokemontcg;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * @SpringBootApplication é uma anotação composta que ativa:
 * - @Configuration       → esta classe pode declarar beans (@Bean)
 * - @EnableAutoConfiguration → Spring Boot configura automaticamente
 *                              H2, JPA, Thymeleaf, etc. com base nas
 *                              dependências no pom.xml
 * - @ComponentScan       → escaneia o pacote "senac.tsi.pokemontcg" e
 *                          todos os subpacotes em busca de @Component,
 *                          @Service, @Repository, @Controller, etc.
 *
 * @EnableAsync ativa o suporte a métodos assíncronos (@Async).
 * Permite que o EnriquecimentoService enriqueça cartas em background
 * sem bloquear o startup da aplicação.
 */
@SpringBootApplication
@EnableAsync
public class PokemonTcgApplication {

    public static void main(String[] args) {
        SpringApplication.run(PokemonTcgApplication.class, args);
    }
}
