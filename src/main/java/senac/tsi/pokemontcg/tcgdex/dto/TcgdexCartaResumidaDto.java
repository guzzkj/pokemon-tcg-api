package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO que representa o formato resumido de uma carta retornado pela TCGdex
 * no endpoint GET /v2/en/cards (listagem).
 *
 * @JsonIgnoreProperties(ignoreUnknown = true): garante que campos extras
 * retornados pela API externa não causem erros de desserialização.
 * É uma boa prática ao consumir APIs de terceiros, pois elas podem evoluir.
 *
 * Record: imutável por padrão, gera automaticamente construtor, getters,
 * equals, hashCode e toString — ideal para DTOs simples.
 */
@Schema(description = "Representação resumida de uma carta retornada pela API TCGdex")
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexCartaResumidaDto(
        @Schema(description = "ID externo da carta na TCGdex", example = "base1-4")
        String id,

        @Schema(description = "Número da carta dentro da coleção", example = "4")
        String localId,

        @Schema(description = "Nome da carta", example = "Charizard")
        String name,

        @Schema(description = "URL base da imagem (sem extensão)", example = "https://assets.tcgdex.net/pt/base/base1/4")
        String image
) {}
