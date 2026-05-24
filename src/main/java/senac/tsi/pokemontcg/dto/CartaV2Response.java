package senac.tsi.pokemontcg.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import senac.tsi.pokemontcg.entities.Carta;

@Schema(description = "Resposta v2 de carta — inclui campo nomeCompleto calculado")
public record CartaV2Response(

        @Schema(description = "ID interno", example = "1")
        Long id,

        @Schema(description = "Nome da carta", example = "Charizard")
        String nome,

        @Schema(description = "Categoria", example = "POKEMON")
        String categoria,

        @Schema(description = "Pontos de vida", example = "120")
        Integer pontosDeVida,

        @Schema(description = "URL da imagem")
        String imagemUrl,

        @Schema(description = "ID externo TCGdex", example = "base1-4")
        String idExterno,

        @Schema(description = "Número local na coleção", example = "4")
        String numeroLocal,

        @Schema(description = "Nome formatado com categoria e HP", example = "Charizard (POKEMON · 120 HP)")
        String nomeCompleto
) {
    public static CartaV2Response de(Carta carta) {
        String nomeCompleto = carta.getNome()
                + " (" + carta.getCategoria()
                + (carta.getPontosDeVida() != null ? " · " + carta.getPontosDeVida() + " HP" : "")
                + ")";

        return new CartaV2Response(
                carta.getId(),
                carta.getNome(),
                carta.getCategoria() != null ? carta.getCategoria().name() : null,
                carta.getPontosDeVida(),
                carta.getImagemUrl(),
                carta.getIdExterno(),
                carta.getNumeroLocal(),
                nomeCompleto
        );
    }
}
