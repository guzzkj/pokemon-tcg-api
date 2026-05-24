package senac.tsi.pokemontcg.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import senac.tsi.pokemontcg.entities.ApiKey;

import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    Optional<ApiKey> findByChave(String chave);
}
