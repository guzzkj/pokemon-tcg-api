package senac.tsi.pokemontcg.entities;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

@Schema(description = "Detalhes e estatísticas adicionais de uma carta Pokémon TCG")
@Entity
@Table(name = "detalhes_estatisticas")
public class DetalheEstatistica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID interno gerado automaticamente", example = "1")
    private Long id;

    @Schema(description = "Raridade da carta", example = "Rare Holo")
    @Size(max = 100, message = "A raridade deve ter no máximo 100 caracteres")
    private String raridade;

    @Schema(description = "Nome do artista/ilustrador da carta", example = "Mitsuhiro Arita")
    @Size(max = 100, message = "O nome do artista deve ter no máximo 100 caracteres")
    private String artista;

    @Schema(description = "Flavor text da carta", example = "Spits fire that is hot enough to melt boulders.")
    @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres")
    private String descricao;

    @Schema(description = "Pokémon do qual esta carta evolui", example = "Charmeleon")
    @Size(max = 100)
    private String evolucaoDe;

    // unique = true garante relação 1:1 com Carta no banco
    @OneToOne
    @JoinColumn(name = "carta_id", unique = true)
    private Carta carta;

    public DetalheEstatistica() {}

    public DetalheEstatistica(String raridade, String artista, String descricao,
                               String evolucaoDe, Carta carta) {
        this.raridade = raridade;
        this.artista = artista;
        this.descricao = descricao;
        this.evolucaoDe = evolucaoDe;
        this.carta = carta;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRaridade() { return raridade; }
    public void setRaridade(String raridade) { this.raridade = raridade; }
    public String getArtista() { return artista; }
    public void setArtista(String artista) { this.artista = artista; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getEvolucaoDe() { return evolucaoDe; }
    public void setEvolucaoDe(String evolucaoDe) { this.evolucaoDe = evolucaoDe; }
    public Carta getCarta() { return carta; }
    public void setCarta(Carta carta) { this.carta = carta; }
}
