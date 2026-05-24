package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * DTO detalhado de coleção — retornado pelo endpoint GET /v2/en/sets/{id}.
 *
 * O campo "serie" é mapeado como TcgdexSerieResumidaDto (objeto) porque a TCGdex
 * retorna {"id":"base","name":"Base"} — não como String simples.
 */
@Schema(description = "Representação detalhada de uma coleção retornada pela API TCGdex")
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexColecaoDto(
        @Schema(description = "ID externo da coleção", example = "base1")
        String id,

        @Schema(description = "Nome da coleção", example = "Base Set")
        String name,

        @Schema(description = "URL do logo da coleção")
        String logo,

        @Schema(description = "URL do símbolo da coleção")
        String symbol,

        @Schema(description = "Série a que esta coleção pertence")
        TcgdexSerieResumidaDto serie,

        @Schema(description = "Contagem de cartas na coleção")
        TcgdexCardCountDto cardCount,

        @Schema(description = "Lista resumida de cartas da coleção")
        List<TcgdexCartaResumidaDto> cards
) {}
