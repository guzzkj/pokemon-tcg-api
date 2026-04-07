package senac.tsi.pokemontcg.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import senac.tsi.pokemontcg.entities.DetalheEstatistica;

import java.util.Optional;

@Repository
public interface DetalheEstatisticaRepository extends JpaRepository<DetalheEstatistica, Long> {

    Optional<DetalheEstatistica> findByCartaId(Long cartaId);

    Page<DetalheEstatistica> findByArtistaContainingIgnoreCase(String artista, Pageable pageable);
}
