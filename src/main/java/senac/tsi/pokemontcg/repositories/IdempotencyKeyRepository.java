package senac.tsi.pokemontcg.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import senac.tsi.pokemontcg.entities.IdempotencyKey;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, String> {
}
