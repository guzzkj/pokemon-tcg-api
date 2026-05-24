package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO resumido de coleção — retornado embutido no detalhe de uma Carta
 * e na listagem de sets do endpoint GET /v2/en/sets.
 */
@Schema(description = "Representação resumida de uma coleção retornada pela API TCGdex")
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexColecaoResumidaDto(
        @Schema(description = "ID externo da coleção", example = "base1")
        String id,

        @Schema(description = "Nome da coleção", example = "Base Set")
        String name,

        @Schema(description = "URL do logo da coleção")
        String logo,

        @Schema(description = "URL do símbolo da coleção")
        String symbol
) {}
