package senac.tsi.pokemontcg.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import senac.tsi.pokemontcg.entities.Carta;

@Repository
public interface CartaRepository extends JpaRepository<Carta, Long> {

    Page<Carta> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    Page<Carta> findByColecaoId(Long colecaoId, Pageable pageable);
}
