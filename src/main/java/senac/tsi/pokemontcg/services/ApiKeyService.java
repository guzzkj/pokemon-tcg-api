package senac.tsi.pokemontcg.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import senac.tsi.pokemontcg.entities.ApiKey;
import senac.tsi.pokemontcg.repositories.ApiKeyRepository;

import java.util.UUID;

@Service
public class ApiKeyService {

    private final ApiKeyRepository repository;

    @Autowired
    public ApiKeyService(ApiKeyRepository repository) {
        this.repository = repository;
    }

    public ApiKey gerar(String nomeCliente) {
        String chave = UUID.randomUUID().toString().replace("-", "");
        ApiKey apiKey = new ApiKey(chave, nomeCliente);
        return repository.save(apiKey);
    }

    public boolean validar(String chave) {
        return repository.findByChave(chave)
                .map(ApiKey::isAtiva)
                .orElse(false);
    }
}
