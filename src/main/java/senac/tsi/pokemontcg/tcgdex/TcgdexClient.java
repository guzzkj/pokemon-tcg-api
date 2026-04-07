package senac.tsi.pokemontcg.tcgdex;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import senac.tsi.pokemontcg.exceptions.ErroIntegracaoExternaException;
import senac.tsi.pokemontcg.exceptions.TcgdexNaoEncontradoException;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexCartaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexCartaResumidaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexColecaoDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexColecaoResumidaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexSerieResumidaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexSerieDto;

import java.util.List;

/**
 * Consome a API TCGdex — base: https://api.tcgdex.net/v2/en
 * 404 → TcgdexNaoEncontradoException | 5xx → ErroIntegracaoExternaException
 */
@Component
public class TcgdexClient {

    private final RestClient restClient;

    public TcgdexClient(RestClient.Builder builder,
                        @Value("${tcgdex.api.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public List<TcgdexCartaResumidaDto> listarCartas() {
        return restClient.get().uri("/cards").retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Nenhuma carta encontrada na API TCGdex."); })
                .onStatus(s -> s.is5xxServerError(),
                        (req, resp) -> { throw new ErroIntegracaoExternaException("Falha de comunicação com a API TCGdex."); })
                .body(new ParameterizedTypeReference<>() {});
    }

    public TcgdexCartaDto buscarCartaPorId(String id) {
        return restClient.get().uri("/cards/{id}", id).retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Carta '" + id + "' não encontrada na API TCGdex."); })
                .onStatus(s -> s.is5xxServerError(),
                        (req, resp) -> { throw new ErroIntegracaoExternaException("Falha de comunicação com a API TCGdex."); })
                .body(TcgdexCartaDto.class);
    }

    public List<TcgdexColecaoResumidaDto> listarColecoes() {
        return restClient.get().uri("/sets").retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Nenhuma coleção encontrada na API TCGdex."); })
                .onStatus(s -> s.is5xxServerError(),
                        (req, resp) -> { throw new ErroIntegracaoExternaException("Falha de comunicação com a API TCGdex."); })
                .body(new ParameterizedTypeReference<>() {});
    }

    public TcgdexColecaoDto buscarColecaoPorId(String id) {
        return restClient.get().uri("/sets/{id}", id).retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Coleção '" + id + "' não encontrada na API TCGdex."); })
                .onStatus(s -> s.is5xxServerError(),
                        (req, resp) -> { throw new ErroIntegracaoExternaException("Falha de comunicação com a API TCGdex."); })
                .body(TcgdexColecaoDto.class);
    }

    public List<TcgdexSerieResumidaDto> listarSeries() {
        return restClient.get().uri("/series").retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Nenhuma série encontrada na API TCGdex."); })
                .onStatus(s -> s.is5xxServerError(),
                        (req, resp) -> { throw new ErroIntegracaoExternaException("Falha de comunicação com a API TCGdex."); })
                .body(new ParameterizedTypeReference<>() {});
    }

    public TcgdexSerieDto buscarSeriePorId(String id) {
        return restClient.get().uri("/series/{id}", id).retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Série '" + id + "' não encontrada na API TCGdex."); })
                .onStatus(s -> s.is5xxServerError(),
                        (req, resp) -> { throw new ErroIntegracaoExternaException("Falha de comunicação com a API TCGdex."); })
                .body(TcgdexSerieDto.class);
    }

    public List<String> listarTipos() {
        return restClient.get().uri("/types").retrieve()
                .onStatus(s -> s.value() == 404,
                        (req, resp) -> { throw new TcgdexNaoEncontradoException("Nenhum tipo encontrado na API TCGdex."); })
                .onStatus(s -> s.is5xxServerError(),
                        (req, resp) -> { throw new ErroIntegracaoExternaException("Falha de comunicação com a API TCGdex."); })
                .body(new ParameterizedTypeReference<>() {});
    }
}
