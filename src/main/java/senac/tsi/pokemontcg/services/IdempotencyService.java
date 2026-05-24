package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.IdempotencyKey;
import senac.tsi.pokemontcg.repositories.IdempotencyKeyRepository;

@Service
public class IdempotencyService {

    private final IdempotencyKeyRepository repository;

    @Autowired
    public IdempotencyService(IdempotencyKeyRepository repository) {
        this.repository = repository;
    }

    public boolean jaProcessada(String chave) {
        return repository.existsById(chave);
    }

    @Transactional
    public void registrar(String chave, String endpoint) {
        repository.save(new IdempotencyKey(chave, endpoint));
    }
}
