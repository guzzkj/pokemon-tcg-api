package senac.tsi.pokemontcg.infrastructure;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.entities.Colecao;
import senac.tsi.pokemontcg.entities.Serie;
import senac.tsi.pokemontcg.entities.Tipo;
import senac.tsi.pokemontcg.enums.CategoriaCartaEnum;
import senac.tsi.pokemontcg.repositories.CartaRepository;
import senac.tsi.pokemontcg.repositories.ColecaoRepository;
import senac.tsi.pokemontcg.repositories.SerieRepository;
import senac.tsi.pokemontcg.repositories.TipoRepository;
import senac.tsi.pokemontcg.services.EnriquecimentoService;
import senac.tsi.pokemontcg.tcgdex.TcgdexClient;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexCartaResumidaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexColecaoDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexColecaoResumidaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexSerieResumidaDto;

import java.util.*;

/**
 * Importa dados da TCGdex em dois níveis:
 * 1. Bulk (aqui): tipos → séries → coleções + cartas básicas (sem HP)
 * 2. Individual (EnriquecimentoService, async): GET /cards/{id} por carta → HP, tipos, detalhes
 */
@Configuration
public class DataLoader {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);
    private static final int LIMITE_CARTAS = 500;

    @Bean
    CommandLineRunner initDatabase(
            ColecaoRepository colecaoRepo,
            SerieRepository serieRepo,
            TipoRepository tipoRepo,
            CartaRepository cartaRepo,
            TcgdexClient tcgdexClient,
            EnriquecimentoService enriquecimentoService) {

        return args -> {
            log.info("=== Iniciando importação da TCGdex (limite: {} cartas) ===", LIMITE_CARTAS);

            // ── 1. TIPOS ──────────────────────────────────────────────────────
            log.info("[1/4] Importando tipos...");
            List<String> nomesTipos = tcgdexClient.listarTipos();
            for (String nome : nomesTipos) {
                tipoRepo.save(new Tipo(nome));
            }
            log.info("  ✓ {} tipos salvos.", nomesTipos.size());

            // ── 2. SÉRIES ─────────────────────────────────────────────────────
            log.info("[2/4] Importando séries...");
            Map<String, Serie> seriesPorId = new HashMap<>();
            try {
                List<TcgdexSerieResumidaDto> listaSeries = tcgdexClient.listarSeries();
                for (TcgdexSerieResumidaDto s : listaSeries) {
                    Serie serie = serieRepo.save(new Serie(s.id(), s.name(), s.logo()));
                    seriesPorId.put(s.id(), serie);
                }
                log.info("  ✓ {} séries salvas.", seriesPorId.size());
            } catch (Exception e) {
                log.warn("  Séries não importadas: {}", e.getMessage());
            }

            // ── 3. COLEÇÕES + CARTAS ──────────────────────────────────────────
            log.info("[3/4] Importando coleções e cartas (máx. {} cartas)...", LIMITE_CARTAS);
            List<TcgdexColecaoResumidaDto> listaColecoes = tcgdexClient.listarColecoes();
            log.info("  {} coleções encontradas.", listaColecoes.size());

            int totalCartas = 0, setAtual = 0;
            boolean limiteAtingido = false;

            for (TcgdexColecaoResumidaDto resumo : listaColecoes) {
                if (limiteAtingido) break;
                setAtual++;

                TcgdexColecaoDto detalhe;
                try {
                    detalhe = tcgdexClient.buscarColecaoPorId(resumo.id());
                } catch (Exception e) {
                    log.warn("  Set '{}' pulado: {}", resumo.id(), e.getMessage());
                    continue;
                }

                Serie serieVinculada = (detalhe.serie() != null)
                        ? seriesPorId.get(detalhe.serie().id())
                        : null;

                Colecao colecao = colecaoRepo.save(new Colecao(
                        resumo.id(), resumo.name(), serieVinculada, resumo.logo(),
                        detalhe.cardCount() != null ? detalhe.cardCount().total() : null
                ));

                if (detalhe.cards() == null || detalhe.cards().isEmpty()) {
                    log.info("  [{}/{}] '{}' — sem cartas.", setAtual, listaColecoes.size(), resumo.name());
                    continue;
                }

                // HP não está disponível na listagem — será preenchido pelo EnriquecimentoService
                List<Carta> cartasDoSet = new ArrayList<>();
                for (TcgdexCartaResumidaDto c : detalhe.cards()) {
                    if (totalCartas >= LIMITE_CARTAS) { limiteAtingido = true; break; }
                    Carta carta = new Carta(
                            c.id(), c.localId(),
                            c.name() != null ? c.name() : "Desconhecida",
                            c.image() != null ? c.image() + "/high.png" : null,
                            CategoriaCartaEnum.POKEMON, null
                    );
                    carta.setColecao(colecao);
                    cartasDoSet.add(carta);
                    totalCartas++;
                }

                cartaRepo.saveAll(cartasDoSet);
                log.info("  [{}/{}] '{}' → {} cartas | total: {}/{}",
                        setAtual, listaColecoes.size(), resumo.name(),
                        cartasDoSet.size(), totalCartas, LIMITE_CARTAS);
            }

            log.info("  ✓ {} cartas salvas no total.", totalCartas);

            // ── RESUMO ────────────────────────────────────────────────────────
            log.info("=== Importação bulk concluída! ===");
            log.info("  Tipos: {} | Séries: {} | Coleções: {} | Cartas: {}",
                    tipoRepo.count(), serieRepo.count(), colecaoRepo.count(), cartaRepo.count());
            log.info("  H2: http://localhost:8080/h2-console | Swagger: http://localhost:8080/swagger-ui.html");

            // ── 4. ENRIQUECIMENTO ASSÍNCRONO ─────────────────────────────────
            log.info("[4/4] Enriquecimento em background iniciado (HP, tipos, detalhes)...");
            enriquecimentoService.enriquecerTodasCartas();
        };
    }
}
