package senac.tsi.pokemontcg.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKey {

    @Id
    @Column(length = 128)
    private String chave;

    @Column(nullable = false)
    private String endpoint;

    private LocalDateTime processadaEm = LocalDateTime.now();

    public IdempotencyKey() {}

    public IdempotencyKey(String chave, String endpoint) {
        this.chave = chave;
        this.endpoint = endpoint;
    }

    public String getChave() { return chave; }
    public void setChave(String chave) { this.chave = chave; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
    public LocalDateTime getProcessadaEm() { return processadaEm; }
    public void setProcessadaEm(LocalDateTime processadaEm) { this.processadaEm = processadaEm; }
}
