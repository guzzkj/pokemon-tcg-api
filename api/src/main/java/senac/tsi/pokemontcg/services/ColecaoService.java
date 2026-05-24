package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Colecao;
import senac.tsi.pokemontcg.exceptions.RecursoNaoEncontradoException;
import senac.tsi.pokemontcg.repositories.ColecaoRepository;

@Service
@Transactional
public class ColecaoService {

    private final ColecaoRepository colecaoRepository;

    @Autowired
    public ColecaoService(ColecaoRepository colecaoRepository) {
        this.colecaoRepository = colecaoRepository;
    }

    @Transactional(readOnly = true)
    public Page<Colecao> listarTodas(Pageable pageable) {
        return colecaoRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Colecao buscarPorId(Long id) {
        return colecaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Coleção com id " + id + " não encontrada."));
    }

    @Transactional(readOnly = true)
    public Page<Colecao> buscarPorNome(String nome, Pageable pageable) {
        return colecaoRepository.findByNomeContainingIgnoreCase(nome, pageable);
    }

    public Colecao criar(Colecao colecao) {
        return colecaoRepository.save(colecao);
    }

    public Colecao atualizar(Long id, Colecao dados) {
        Colecao colecao = buscarPorId(id);
        colecao.setNome(dados.getNome());
        colecao.setSerie(dados.getSerie());
        colecao.setLogoUrl(dados.getLogoUrl());
        colecao.setTotalDeCartas(dados.getTotalDeCartas());
        colecao.setCodigoExterno(dados.getCodigoExterno());
        return colecaoRepository.save(colecao);
    }

    public void deletar(Long id) {
        if (!colecaoRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Coleção com id " + id + " não encontrada.");
        }
        colecaoRepository.deleteById(id);
    }
}
