package senac.tsi.pokemontcg.infrastructure;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Pokémon TCG API",
                version = "1.0.0",
                description = """
                        API RESTful para gerenciamento de cartas do Pokémon Trading Card Game.

                        Funcionalidades:
                        - CRUD completo para 5 entidades: Carta, DetalheEstatistica, Colecao, Tipo e Serie
                        - Integração com a API externa TCGdex (endpoint oficial https://api.tcgdex.net/v2/en) para busca e importação de cartas
                        - Paginação em todas as rotas de listagem (Pageable)
                        - HATEOAS com links de navegação em todas as respostas
                        - Banco de dados H2 em memória (acessível em /h2-console)

                        Desenvolvido para a disciplina de Web Services — SENAC TSI.
                        """,
                contact = @Contact(
                        name = "SENAC TSI",
                        email = "webservices@senac.br"
                ),
                license = @License(
                        name = "MIT License",
                        url = "https://opensource.org/licenses/MIT"
                )
        )
)
public class OpenApiConfig {
}
