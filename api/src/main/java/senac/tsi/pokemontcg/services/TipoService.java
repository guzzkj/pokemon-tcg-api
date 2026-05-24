package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.entities.Tipo;
import senac.tsi.pokemontcg.exceptions.RecursoNaoEncontradoException;
import senac.tsi.pokemontcg.repositories.CartaRepository;
import senac.tsi.pokemontcg.repositories.TipoRepository;

@Service
@Transactional
public class TipoService {

    private final TipoRepository tipoRepository;
    private final CartaRepository cartaRepository;

    @Autowired
    public TipoService(TipoRepository tipoRepository, CartaRepository cartaRepository) {
        this.tipoRepository = tipoRepository;
        this.cartaRepository = cartaRepository;
    }

    @Transactional(readOnly = true)
    public Page<Tipo> listarTodos(Pageable pageable) {
        return tipoRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Tipo buscarPorId(Long id) {
        return tipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Tipo com id " + id + " não encontrado."));
    }

    @Transactional(readOnly = true)
    public Page<Tipo> buscarPorNome(String nome, Pageable pageable) {
        return tipoRepository.findByNomeContainingIgnoreCase(nome, pageable);
    }

    public Tipo criar(Tipo tipo) {
        return tipoRepository.save(tipo);
    }

    public Tipo atualizar(Long id, Tipo dados) {
        Tipo tipo = buscarPorId(id);
        tipo.setNome(dados.getNome());
        return tipoRepository.save(tipo);
    }

    public void deletar(Long id) {
        if (!tipoRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Tipo com id " + id + " não encontrado.");
        }
        tipoRepository.deleteById(id);
    }

    public Tipo adicionarCarta(Long tipoId, Long cartaId) {
        Tipo tipo = buscarPorId(tipoId);
        Carta carta = cartaRepository.findById(cartaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Carta com id " + cartaId + " não encontrada."));
        tipo.getCartas().add(carta);
        return tipoRepository.save(tipo);
    }

    public Tipo removerCarta(Long tipoId, Long cartaId) {
        Tipo tipo = buscarPorId(tipoId);
        tipo.getCartas().removeIf(c -> c.getId().equals(cartaId));
        return tipoRepository.save(tipo);
    }
}
