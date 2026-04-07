package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO resumido de série — retornado na listagem GET /v2/en/series
 * e embutido no detalhe de uma coleção GET /v2/en/sets/{id}.
 */
@Schema(description = "Representação resumida de uma série retornada pela API TCGdex")
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexSerieResumidaDto(
        @Schema(description = "ID externo da série na TCGdex", example = "base")
        String id,

        @Schema(description = "Nome da série", example = "Base")
        String name,

        @Schema(description = "URL do logo da série")
        String logo
) {}
