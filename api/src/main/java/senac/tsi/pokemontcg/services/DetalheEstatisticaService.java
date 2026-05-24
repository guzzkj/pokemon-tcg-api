package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.entities.DetalheEstatistica;
import senac.tsi.pokemontcg.exceptions.RecursoNaoEncontradoException;
import senac.tsi.pokemontcg.repositories.CartaRepository;
import senac.tsi.pokemontcg.repositories.DetalheEstatisticaRepository;

@Service
@Transactional
public class DetalheEstatisticaService {

    private final DetalheEstatisticaRepository detalheRepository;
    private final CartaRepository cartaRepository;

    @Autowired
    public DetalheEstatisticaService(DetalheEstatisticaRepository detalheRepository,
                                      CartaRepository cartaRepository) {
        this.detalheRepository = detalheRepository;
        this.cartaRepository = cartaRepository;
    }

    @Transactional(readOnly = true)
    public Page<DetalheEstatistica> listarTodos(Pageable pageable) {
        return detalheRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public DetalheEstatistica buscarPorId(Long id) {
        return detalheRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Detalhe estatístico com id " + id + " não encontrado."));
    }

    @Transactional(readOnly = true)
    public DetalheEstatistica buscarPorCartaId(Long cartaId) {
        return detalheRepository.findByCartaId(cartaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Nenhum detalhe encontrado para a carta com id " + cartaId + "."));
    }

    @Transactional(readOnly = true)
    public Page<DetalheEstatistica> buscarPorArtista(String artista, Pageable pageable) {
        return detalheRepository.findByArtistaContainingIgnoreCase(artista, pageable);
    }

    public DetalheEstatistica criar(Long cartaId, DetalheEstatistica detalhe) {
        Carta carta = cartaRepository.findById(cartaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Carta com id " + cartaId + " não encontrada."));
        detalhe.setCarta(carta);
        return detalheRepository.save(detalhe);
    }

    public DetalheEstatistica atualizar(Long id, DetalheEstatistica dados) {
        DetalheEstatistica detalhe = buscarPorId(id);
        detalhe.setRaridade(dados.getRaridade());
        detalhe.setArtista(dados.getArtista());
        detalhe.setDescricao(dados.getDescricao());
        detalhe.setEvolucaoDe(dados.getEvolucaoDe());
        return detalheRepository.save(detalhe);
    }

    public void deletar(Long id) {
        if (!detalheRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException(
                    "Detalhe estatístico com id " + id + " não encontrado.");
        }
        detalheRepository.deleteById(id);
    }
}
