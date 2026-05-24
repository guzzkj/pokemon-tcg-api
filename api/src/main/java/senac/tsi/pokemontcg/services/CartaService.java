package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.exceptions.RecursoNaoEncontradoException;
import senac.tsi.pokemontcg.repositories.CartaRepository;

@Service
@Transactional
public class CartaService {

    private final CartaRepository cartaRepository;

    @Autowired
    public CartaService(CartaRepository cartaRepository) {
        this.cartaRepository = cartaRepository;
    }

    @Transactional(readOnly = true)
    public Page<Carta> listarTodas(Pageable pageable) {
        return cartaRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Carta buscarPorId(Long id) {
        return cartaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Carta com id " + id + " não encontrada."));
    }

    @Transactional(readOnly = true)
    public Page<Carta> buscarPorNome(String nome, Pageable pageable) {
        String nomeSanitizado = nome.replace("%", "\\%").replace("_", "\\_");
        return cartaRepository.findByNomeContainingIgnoreCase(nomeSanitizado, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Carta> listarPorColecao(Long colecaoId, Pageable pageable) {
        return cartaRepository.findByColecaoId(colecaoId, pageable);
    }

    public Carta criar(Carta carta) {
        return cartaRepository.save(carta);
    }

    public Carta atualizar(Long id, Carta dados) {
        Carta carta = buscarPorId(id);
        carta.setNome(dados.getNome());
        carta.setNumeroLocal(dados.getNumeroLocal());
        carta.setImagemUrl(dados.getImagemUrl());
        carta.setCategoria(dados.getCategoria());
        carta.setPontosDeVida(dados.getPontosDeVida());
        carta.setColecao(dados.getColecao());
        return cartaRepository.save(carta);
    }

    public void deletar(Long id) {
        if (!cartaRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Carta com id " + id + " não encontrada.");
        }
        cartaRepository.deleteById(id);
    }
}
