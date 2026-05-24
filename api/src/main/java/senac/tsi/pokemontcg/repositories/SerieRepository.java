package senac.tsi.pokemontcg.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import senac.tsi.pokemontcg.entities.Serie;

import java.util.Optional;

@Repository
public interface SerieRepository extends JpaRepository<Serie, Long> {

    Page<Serie> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    // Usado no DataLoader para evitar duplicatas ao importar
    Optional<Serie> findByIdExterno(String idExterno);
}
