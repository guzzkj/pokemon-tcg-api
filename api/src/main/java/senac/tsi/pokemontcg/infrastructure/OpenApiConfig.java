package senac.tsi.pokemontcg.infrastructure;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

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
        """
        ),
        security = {
                @SecurityRequirement(name = "ApiKeyAuth")
        }
)
public class OpenApiConfig {
}
