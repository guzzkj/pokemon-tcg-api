package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Serie;
import senac.tsi.pokemontcg.exceptions.RecursoNaoEncontradoException;
import senac.tsi.pokemontcg.repositories.SerieRepository;

@Service
@Transactional
public class SerieService {

    private final SerieRepository serieRepository;

    @Autowired
    public SerieService(SerieRepository serieRepository) {
        this.serieRepository = serieRepository;
    }

    @Transactional(readOnly = true)
    public Page<Serie> listarTodas(Pageable pageable) {
        return serieRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Serie buscarPorId(Long id) {
        return serieRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Série com id " + id + " não encontrada."));
    }

    @Transactional(readOnly = true)
    public Page<Serie> buscarPorNome(String nome, Pageable pageable) {
        return serieRepository.findByNomeContainingIgnoreCase(nome, pageable);
    }

    public Serie criar(Serie serie) {
        return serieRepository.save(serie);
    }

    public Serie atualizar(Long id, Serie dados) {
        Serie serie = buscarPorId(id);
        serie.setNome(dados.getNome());
        serie.setIdExterno(dados.getIdExterno());
        serie.setLogoUrl(dados.getLogoUrl());
        return serieRepository.save(serie);
    }

    public void deletar(Long id) {
        if (!serieRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Série com id " + id + " não encontrada.");
        }
        serieRepository.deleteById(id);
    }
}
