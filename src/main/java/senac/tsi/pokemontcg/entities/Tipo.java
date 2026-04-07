package senac.tsi.pokemontcg.entities;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "Tipo de energia de uma carta Pokémon (ex: Fire, Water, Grass)")
@Entity
@Table(name = "tipos")
public class Tipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID interno gerado automaticamente", example = "1")
    private Long id;

    @Schema(description = "Nome do tipo de energia", example = "Fire")
    @NotBlank(message = "O nome do tipo é obrigatório")
    @Size(min = 1, max = 50, message = "O nome deve ter entre 1 e 50 caracteres")
    @Column(unique = true)
    private String nome;

    // Lado dono do Many-to-Many — define a tabela intermediária carta_tipo
    @ManyToMany
    @JoinTable(
        name = "carta_tipo",
        joinColumns = @JoinColumn(name = "tipo_id"),
        inverseJoinColumns = @JoinColumn(name = "carta_id")
    )
    private List<Carta> cartas = new ArrayList<>();

    public Tipo() {}

    public Tipo(String nome) {
        this.nome = nome;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public List<Carta> getCartas() { return cartas; }
    public void setCartas(List<Carta> cartas) { this.cartas = cartas; }
}
