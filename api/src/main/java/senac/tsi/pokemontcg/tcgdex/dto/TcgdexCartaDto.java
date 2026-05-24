package senac.tsi.pokemontcg.tcgdex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * DTO que representa o formato detalhado de uma carta retornado pela TCGdex
 * no endpoint GET /v2/en/cards/{id}.
 *
 * Campos como "illustrator", "rarity", "evolveFrom" podem ser null
 * dependendo do tipo de carta (ex: cartas de Energia geralmente não têm HP).
 */
@Schema(description = "Representação detalhada de uma carta retornada pela API TCGdex")
@JsonIgnoreProperties(ignoreUnknown = true)
public record TcgdexCartaDto(
        @Schema(description = "ID externo da carta", example = "base1-4")
        String id,

        @Schema(description = "Número local dentro da coleção", example = "4")
        String localId,

        @Schema(description = "Nome da carta", example = "Charizard")
        String name,

        @Schema(description = "URL base da imagem")
        String image,

        @Schema(description = "Categoria da carta em inglês (Pokemon, Trainer, Energy)", example = "Pokemon")
        String category,

        @Schema(description = "Nome do ilustrador", example = "Mitsuhiro Arita")
        String illustrator,

        @Schema(description = "Raridade da carta", example = "Rare Holo")
        String rarity,

        @Schema(description = "Flavor text da carta")
        String description,

        @Schema(description = "Pontos de vida (HP)", example = "120")
        Integer hp,

        @Schema(description = "Lista de tipos da carta", example = "[\"Fire\"]")
        List<String> types,

        @Schema(description = "Pokémon do qual esta carta evolui", example = "Charmeleon")
        String evolveFrom,

        @Schema(description = "Informações resumidas da coleção")
        TcgdexColecaoResumidaDto set
) {}
