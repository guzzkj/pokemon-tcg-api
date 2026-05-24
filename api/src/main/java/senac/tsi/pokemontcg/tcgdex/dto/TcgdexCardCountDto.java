package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO auxiliar que representa a contagem de cartas em uma coleção.
 * Retornado como campo aninhado no TcgdexColecaoDto.
 */
@Schema(description = "Contagem de cartas em uma coleção")
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexCardCountDto(
        @Schema(description = "Total de cartas incluindo secretas", example = "102")
        Integer total,

        @Schema(description = "Total de cartas numeradas oficialmente", example = "102")
        Integer official
) {}
