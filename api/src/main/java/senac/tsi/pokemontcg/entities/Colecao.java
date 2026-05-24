package senac.tsi.pokemontcg.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "Representa uma coleção (set) oficial de cartas Pokémon TCG")
@Entity
@Table(name = "colecoes")
public class Colecao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID interno gerado automaticamente pelo banco", example = "1")
    private Long id;

    @Schema(description = "Código externo usado na TCGdex (ex: base1, sv1)", example = "base1")
    @Size(max = 50, message = "O código externo deve ter no máximo 50 caracteres")
    @Column(unique = true)
    private String codigoExterno;

    @Schema(description = "Nome oficial da coleção", example = "Base Set")
    @NotBlank(message = "O nome da coleção é obrigatório")
    @Size(min = 1, max = 100, message = "O nome deve ter entre 1 e 100 caracteres")
    private String nome;

    @ManyToOne
    @JoinColumn(name = "serie_id")
    private Serie serie;

    @Schema(description = "URL do logo da coleção")
    @Size(max = 500)
    private String logoUrl;

    @Schema(description = "Número total de cartas na coleção", example = "102")
    private Integer totalDeCartas;

    // @JsonIgnore evita loop: Colecao → Carta → Colecao → ...
    @JsonIgnore
    @OneToMany(mappedBy = "colecao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Carta> cartas = new ArrayList<>();

    public Colecao() {}

    public Colecao(String codigoExterno, String nome, Serie serie, String logoUrl, Integer totalDeCartas) {
        this.codigoExterno = codigoExterno;
        this.nome = nome;
        this.serie = serie;
        this.logoUrl = logoUrl;
        this.totalDeCartas = totalDeCartas;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigoExterno() { return codigoExterno; }
    public void setCodigoExterno(String codigoExterno) { this.codigoExterno = codigoExterno; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public Serie getSerie() { return serie; }
    public void setSerie(Serie serie) { this.serie = serie; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public Integer getTotalDeCartas() { return totalDeCartas; }
    public void setTotalDeCartas(Integer totalDeCartas) { this.totalDeCartas = totalDeCartas; }
    public List<Carta> getCartas() { return cartas; }
    public void setCartas(List<Carta> cartas) { this.cartas = cartas; }
}
