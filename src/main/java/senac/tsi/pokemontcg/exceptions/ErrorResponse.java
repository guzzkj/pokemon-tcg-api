package senac.tsi.pokemontcg.exceptions;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Estrutura padrão de resposta de erro da API")
public record ErrorResponse(

        @Schema(description = "Código de status HTTP do erro", example = "404")
        int status,

        @Schema(description = "Categoria resumida do erro", example = "Recurso não encontrado")
        String erro,

        @Schema(description = "Mensagem detalhada explicando o que ocorreu",
                example = "Carta com id 99 não encontrada.")
        String mensagem
) {}
