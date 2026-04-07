package senac.tsi.pokemontcg.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "Representa uma série que agrupa coleções do Pokémon TCG")
@Entity
@Table(name = "series")
public class Serie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID interno gerado automaticamente pelo banco", example = "1")
    private Long id;

    @Schema(description = "Código externo usado na TCGdex (ex: base, sword-and-shield)", example = "base")
    @Size(max = 50, message = "O código externo deve ter no máximo 50 caracteres")
    @Column(unique = true)
    private String idExterno;

    @Schema(description = "Nome oficial da série", example = "Base")
    @NotBlank(message = "O nome da série é obrigatório")
    @Size(min = 1, max = 100, message = "O nome deve ter entre 1 e 100 caracteres")
    private String nome;

    @Schema(description = "URL do logo da série")
    @Size(max = 500)
    private String logoUrl;

    // @JsonIgnore evita loop: Serie → Colecao → Serie → ...
    @JsonIgnore
    @OneToMany(mappedBy = "serie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Colecao> colecoes = new ArrayList<>();

    public Serie() {}

    public Serie(String idExterno, String nome, String logoUrl) {
        this.idExterno = idExterno;
        this.nome = nome;
        this.logoUrl = logoUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIdExterno() { return idExterno; }
    public void setIdExterno(String idExterno) { this.idExterno = idExterno; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public List<Colecao> getColecoes() { return colecoes; }
    public void setColecoes(List<Colecao> colecoes) { this.colecoes = colecoes; }
}
