package senac.tsi.pokemontcg.infrastructure;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@SecurityScheme(
        name = "ApiKeyAuth",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.HEADER,
        paramName = "X-API-Key",
        description = "Chave de API gerada em POST /api-keys. Obrigatoria nos endpoints protegidos."
)
@SecurityScheme(
        name = "IdempotencyKey",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.HEADER,
        paramName = "X-Idempotency-Key",
        description = "Chave opcional para evitar processamento duplicado em requisicoes POST."
)
@SecurityScheme(
        name = "ApiVersion",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.HEADER,
        paramName = "X-API-Version",
        description = "Versao da API. Valores suportados no endpoint de carta por ID: v1 e v2."
)
@OpenAPIDefinition(
        info = @Info(
                title = "Pokemon TCG API",
                version = "1.0",
                description = """
                        API RESTful para gerenciamento de cartas do Pokemon TCG.

                        Funcionalidades:
                        - CRUD completo para 5 entidades: Carta, DetalheEstatistica, Colecao, Tipo e Serie
                        - Integracao com a API externa TCGdex (endpoint oficial https://api.tcgdex.net/v2/en)
                        - Paginacao em todas as rotas de listagem (Pageable)
                        - HATEOAS com links de navegacao em todas as respostas
                        - Banco de dados H2 em memoria (acessivel em /h2-console)
                        - Autenticacao por X-API-Key
                        - Idempotencia em POST por X-Idempotency-Key
                        - Rate limiting com headers X-RateLimit-* e Retry-After
                        - Versionamento por header X-API-Version

                        Desenvolvido para a disciplina de Web Services - SENAC TSI.
                        """
        )
)
public class OpenApiConfig {
}
