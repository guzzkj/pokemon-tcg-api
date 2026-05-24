package senac.tsi.pokemontcg.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import senac.tsi.pokemontcg.entities.Tipo;

import java.util.Optional;

@Repository
public interface TipoRepository extends JpaRepository<Tipo, Long> {

    Page<Tipo> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    // Usado no enriquecimento para vincular tipos retornados pela TCGdex
    Optional<Tipo> findByNomeIgnoreCase(String nome);
}
