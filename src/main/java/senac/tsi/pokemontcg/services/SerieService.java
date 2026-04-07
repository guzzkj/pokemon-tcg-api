package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Serie;
import senac.tsi.pokemontcg.exceptions.RecursoNaoEncontradoException;
import senac.tsi.pokemontcg.repositories.SerieRepository;
import senac.tsi.pokemontcg.tcgdex.TcgdexClient;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexSerieDto;

@Service
@Transactional
public class SerieService {

    private final SerieRepository serieRepository;
    private final TcgdexClient tcgdexClient;

    @Autowired
    public SerieService(SerieRepository serieRepository, TcgdexClient tcgdexClient) {
        this.serieRepository = serieRepository;
        this.tcgdexClient = tcgdexClient;
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

    /**
     * Busca uma série na TCGdex pelo ID externo e a persiste no banco local.
     * Se já existir uma série com o mesmo idExterno, retorna a existente.
     *
     * @param idExterno ex: "base", "sword-and-shield"
     */
    public Serie importarDaTcgdex(String idExterno) {
        // Evita duplicata: retorna a existente se já foi importada
        return serieRepository.findByIdExterno(idExterno).orElseGet(() -> {
            TcgdexSerieDto dto = tcgdexClient.buscarSeriePorId(idExterno);
            Serie serie = new Serie(dto.id(), dto.name(), dto.logo());
            return serieRepository.save(serie);
        });
    }
}
