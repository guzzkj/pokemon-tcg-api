package senac.tsi.pokemontcg.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.entities.DetalheEstatistica;
import senac.tsi.pokemontcg.enums.CategoriaCartaEnum;
import senac.tsi.pokemontcg.repositories.CartaRepository;
import senac.tsi.pokemontcg.repositories.DetalheEstatisticaRepository;
import senac.tsi.pokemontcg.repositories.TipoRepository;
import senac.tsi.pokemontcg.tcgdex.TcgdexClient;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexCartaDto;

import java.util.List;

/**
 * Enriquece as cartas importadas em bulk com dados completos da TCGdex (HP, tipos, detalhes).
 *
 * @Async e @Transactional não podem coexistir eficientemente no mesmo método quando
 * queremos um commit por carta. A solução é auto-injeção via @Lazy: este bean injeta
 * a si mesmo para chamar enriquecerUmaCarta() através do proxy Spring, garantindo
 * que @Transactional funcione corretamente em cada iteração.
 */
@Service
public class EnriquecimentoService {

    private static final Logger log = LoggerFactory.getLogger(EnriquecimentoService.class);
    private static final long DELAY_ENTRE_REQUESTS_MS = 150;

    private final CartaRepository cartaRepository;
    private final TipoRepository tipoRepository;
    private final DetalheEstatisticaRepository detalheRepository;
    private final TcgdexClient tcgdexClient;

    @Lazy
    @Autowired
    private EnriquecimentoService self;

    @Autowired
    public EnriquecimentoService(CartaRepository cartaRepository,
                                  TipoRepository tipoRepository,
                                  DetalheEstatisticaRepository detalheRepository,
                                  TcgdexClient tcgdexClient) {
        this.cartaRepository = cartaRepository;
        this.tipoRepository = tipoRepository;
        this.detalheRepository = detalheRepository;
        this.tcgdexClient = tcgdexClient;
    }

    @Async
    public void enriquecerTodasCartas() {
        List<Carta> cartas = cartaRepository.findAll();
        log.info("[Enriquecimento] Iniciando: {} cartas | estimativa: ~{}s",
                cartas.size(), (cartas.size() * DELAY_ENTRE_REQUESTS_MS) / 1000);

        int sucesso = 0, falhas = 0, puladas = 0;

        for (Carta carta : cartas) {
            if (carta.getIdExterno() == null || carta.getIdExterno().isBlank()) {
                puladas++;
                continue;
            }
            try {
                self.enriquecerUmaCarta(carta.getId(), carta.getIdExterno());
                sucesso++;
                if (sucesso % 50 == 0) {
                    log.info("[Enriquecimento] Progresso: {}/{} ({} falhas)",
                            sucesso + falhas, cartas.size() - puladas, falhas);
                }
                Thread.sleep(DELAY_ENTRE_REQUESTS_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("[Enriquecimento] Interrompido após {} cartas.", sucesso);
                return;
            } catch (Exception e) {
                falhas++;
                log.debug("[Enriquecimento] Carta '{}' pulada: {}", carta.getIdExterno(), e.getMessage());
            }
        }

        log.info("[Enriquecimento] Concluído — OK: {} | Falhas: {} | Sem ID: {}", sucesso, falhas, puladas);
    }

    @Transactional
    public void enriquecerUmaCarta(Long cartaId, String idExterno) {
        TcgdexCartaDto dto = tcgdexClient.buscarCartaPorId(idExterno);
        Carta carta = cartaRepository.findById(cartaId).orElseThrow();

        // 1. Atualiza HP e categoria real
        carta.setPontosDeVida(dto.hp());
        if (dto.category() != null) {
            carta.setCategoria(CategoriaCartaEnum.fromTexto(dto.category()));
        }
        cartaRepository.save(carta);

        // 2. Cria DetalheEstatistica se ainda não existe
        if (detalheRepository.findByCartaId(cartaId).isEmpty()) {
            detalheRepository.save(new DetalheEstatistica(
                    truncate(dto.rarity(), 100),
                    truncate(dto.illustrator(), 100),
                    truncate(dto.description(), 1000),
                    truncate(dto.evolveFrom(), 100),
                    carta
            ));
        }

        // 3. Vincula tipos (Many-to-Many → tabela carta_tipo)
        if (dto.types() != null) {
            for (String nomeTipo : dto.types()) {
                tipoRepository.findByNomeIgnoreCase(nomeTipo).ifPresent(tipo -> {
                    boolean jaVinculado = tipo.getCartas().stream()
                            .anyMatch(c -> c.getId().equals(cartaId));
                    if (!jaVinculado) {
                        tipo.getCartas().add(carta);
                        tipoRepository.save(tipo);
                    }
                });
            }
        }
    }

    private String truncate(String valor, int maxLength) {
        if (valor == null) return null;
        return valor.length() <= maxLength ? valor : valor.substring(0, maxLength);
    }
}
