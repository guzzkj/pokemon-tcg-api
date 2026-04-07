package senac.tsi.pokemontcg.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import senac.tsi.pokemontcg.entities.Colecao;

import java.util.Optional;

@Repository
public interface ColecaoRepository extends JpaRepository<Colecao, Long> {

    Page<Colecao> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    Optional<Colecao> findByCodigoExterno(String codigoExterno);
}
