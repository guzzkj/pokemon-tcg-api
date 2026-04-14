package senac.tsi.pokemontcg.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import senac.tsi.pokemontcg.enums.CategoriaCartaEnum;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "Representa uma carta do Pokémon Trading Card Game")
@Entity
@Table(name = "cartas")
public class Carta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID interno gerado automaticamente", example = "1")
    private Long id;

    @Schema(description = "ID externo da carta na TCGdex (ex: base1-4)", example = "base1-4")
    @Size(max = 50)
    private String idExterno;

    @Schema(description = "Número da carta dentro da coleção", example = "4")
    @Size(max = 20)
    private String numeroLocal;

    @Schema(description = "Nome da carta", example = "Charizard")
    @NotBlank(message = "O nome da carta é obrigatório")
    @Size(min = 1, max = 100, message = "O nome deve ter entre 1 e 100 caracteres")
    private String nome;

    @Schema(description = "URL da imagem da carta em alta resolução")
    @Size(max = 500)
    private String imagemUrl;

    // EnumType.STRING persiste o nome ("POKEMON") em vez do índice numérico
    @Schema(description = "Categoria da carta (POKEMON, TREINADOR ou ENERGIA)", example = "POKEMON")
    @NotNull(message = "A categoria da carta é obrigatória")
    @Enumerated(EnumType.STRING)
    private CategoriaCartaEnum categoria;

    @Schema(description = "Pontos de vida da carta (HP). Null para Treinadores e Energias.", example = "120")
    @jakarta.validation.constraints.Min(value = 0, message = "Os pontos de vida não podem ser negativos")
    @jakarta.validation.constraints.Max(value = 999, message = "Os pontos de vida não podem ultrapassar 999")
    private Integer pontosDeVida;

    @ManyToOne
    @JoinColumn(name = "colecao_id")
    private Colecao colecao;

    // @JsonIgnore evita loop: Carta → DetalheEstatistica → Carta → ...
    @JsonIgnore
    @OneToOne(mappedBy = "carta", cascade = CascadeType.ALL, orphanRemoval = true)
    private DetalheEstatistica detalheEstatistica;

    // @JsonIgnore evita loop: Carta → Tipo → Carta → ...
    @JsonIgnore
    @ManyToMany(mappedBy = "cartas")
    private List<Tipo> tipos = new ArrayList<>();

    public Carta() {}

    public Carta(String idExterno, String numeroLocal, String nome,
                 String imagemUrl, CategoriaCartaEnum categoria, Integer pontosDeVida) {
        this.idExterno = idExterno;
        this.numeroLocal = numeroLocal;
        this.nome = nome;
        this.imagemUrl = imagemUrl;
        this.categoria = categoria;
        this.pontosDeVida = pontosDeVida;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIdExterno() { return idExterno; }
    public void setIdExterno(String idExterno) { this.idExterno = idExterno; }
    public String getNumeroLocal() { return numeroLocal; }
    public void setNumeroLocal(String numeroLocal) { this.numeroLocal = numeroLocal; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public CategoriaCartaEnum getCategoria() { return categoria; }
    public void setCategoria(CategoriaCartaEnum categoria) { this.categoria = categoria; }
    public Integer getPontosDeVida() { return pontosDeVida; }
    public void setPontosDeVida(Integer pontosDeVida) { this.pontosDeVida = pontosDeVida; }
    public Colecao getColecao() { return colecao; }
    public void setColecao(Colecao colecao) { this.colecao = colecao; }
    public DetalheEstatistica getDetalheEstatistica() { return detalheEstatistica; }
    public void setDetalheEstatistica(DetalheEstatistica detalheEstatistica) { this.detalheEstatistica = detalheEstatistica; }
    public List<Tipo> getTipos() { return tipos; }
    public void setTipos(List<Tipo> tipos) { this.tipos = tipos; }
}
