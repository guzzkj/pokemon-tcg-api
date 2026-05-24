package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * DTO detalhado de série — retornado pelo endpoint GET /v2/en/series/{id}.
 * Inclui a lista resumida das coleções pertencentes à série.
 */
@Schema(description = "Representação detalhada de uma série retornada pela API TCGdex")
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexSerieDto(
        @Schema(description = "ID externo da série", example = "base")
        String id,

        @Schema(description = "Nome da série", example = "Base")
        String name,

        @Schema(description = "URL do logo da série")
        String logo,

        @Schema(description = "Lista resumida das coleções pertencentes a esta série")
        List<TcgdexColecaoResumidaDto> sets
) {}
