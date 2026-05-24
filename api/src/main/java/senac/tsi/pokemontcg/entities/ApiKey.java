package senac.tsi.pokemontcg.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String chave;

    @Column(nullable = false)
    private String nomeCliente;

    private boolean ativa = true;

    private LocalDateTime criadaEm = LocalDateTime.now();

    public ApiKey() {}

    public ApiKey(String chave, String nomeCliente) {
        this.chave = chave;
        this.nomeCliente = nomeCliente;
    }

    public Long getId() { return id; }
    public String getChave() { return chave; }
    public void setChave(String chave) { this.chave = chave; }
    public String getNomeCliente() { return nomeCliente; }
    public void setNomeCliente(String nomeCliente) { this.nomeCliente = nomeCliente; }
    public boolean isAtiva() { return ativa; }
    public void setAtiva(boolean ativa) { this.ativa = ativa; }
    public LocalDateTime getCriadaEm() { return criadaEm; }
    public void setCriadaEm(LocalDateTime criadaEm) { this.criadaEm = criadaEm; }
}
