package senac.tsi.pokemontcg.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Categoria da carta Pokémon TCG")
public enum CategoriaCartaEnum {

    POKEMON("Pokémon"),
    TREINADOR("Treinador"),
    ENERGIA("Energia");

    private final String descricao;

    CategoriaCartaEnum(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /** Converte o texto da TCGdex (inglês ou português) para o enum correspondente. */
    public static CategoriaCartaEnum fromTexto(String texto) {
        if (texto == null) return POKEMON;
        return switch (texto.toLowerCase()) {
            case "pokemon", "pokémon" -> POKEMON;
            case "trainer", "treinador" -> TREINADOR;
            case "energy", "energia" -> ENERGIA;
            default -> POKEMON;
        };
    }
}
