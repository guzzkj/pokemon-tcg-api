package senac.tsi.pokemontcg.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.tcgdex.TcgdexClient;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexCartaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexCartaResumidaDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexColecaoDto;
import senac.tsi.pokemontcg.tcgdex.dto.TcgdexColecaoResumidaDto;

import java.util.List;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

/**
 * Controller que expõe endpoints para consumir a API externa TCGdex.
 *
 * Estes endpoints NÃO persistem dados no banco — servem como "proxy"
 * para explorar o catálogo da TCGdex diretamente.
 * Para importar e salvar, use POST /cartas/importar/{idExterno}.
 *
 * Paginação "virtual": a TCGdex retorna listas completas (sem paginação nativa).
 * Nós buscamos tudo e fatiamos manualmente com PageImpl, aplicando o Pageable
 * recebido do cliente para manter o padrão de paginação da nossa API.
 */
@Tag(name = "TCGdex (API Externa)", description = "Consulta direta à API TCGdex (endpoint oficial em inglês). "
        + "Dados retornados não são salvos no banco — use /cartas/importar para persistir.")
@RestController
@RequestMapping("/tcgdex")
public class TcgdexController {

    private final TcgdexClient tcgdexClient;
    private final PagedResourcesAssembler<TcgdexCartaResumidaDto> cartaPagedAssembler;
    private final PagedResourcesAssembler<TcgdexColecaoResumidaDto> colecaoPagedAssembler;

    @Autowired
    public TcgdexController(TcgdexClient tcgdexClient,
                            PagedResourcesAssembler<TcgdexCartaResumidaDto> cartaPagedAssembler,
                            PagedResourcesAssembler<TcgdexColecaoResumidaDto> colecaoPagedAssembler) {
        this.tcgdexClient = tcgdexClient;
        this.cartaPagedAssembler = cartaPagedAssembler;
        this.colecaoPagedAssembler = colecaoPagedAssembler;
    }

    @Operation(
        summary = "Lista cartas da TCGdex",
        description = "Consulta o endpoint GET /v2/en/cards da TCGdex e retorna a lista paginada. "
                + "A paginação é aplicada sobre o resultado completo da API externa."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de cartas da TCGdex"),
            @ApiResponse(responseCode = "401", description = "API Key ausente ou inválida",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/cartas")
    public ResponseEntity<PagedModel<EntityModel<TcgdexCartaResumidaDto>>> listarCartas(
            @ParameterObject Pageable pageable) {
        List<TcgdexCartaResumidaDto> todas = tcgdexClient.listarCartas();

        int inicio = (int) pageable.getOffset();
        int fim = Math.min(inicio + pageable.getPageSize(), todas.size());
        List<TcgdexCartaResumidaDto> paginaAtual = (inicio > todas.size())
                ? List.of()
                : todas.subList(inicio, fim);

        Page<TcgdexCartaResumidaDto> page = new PageImpl<>(paginaAtual, pageable, todas.size());
        PagedModel<EntityModel<TcgdexCartaResumidaDto>> pagedModel = cartaPagedAssembler.toModel(page,
                carta -> EntityModel.of(carta,
                        linkTo(methodOn(TcgdexController.class).buscarCartaPorId(carta.id())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(
        summary = "Busca detalhes de uma carta na TCGdex",
        description = "Consulta o endpoint GET /v2/en/cards/{id} da TCGdex e retorna os detalhes completos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Carta encontrada na TCGdex"),
            @ApiResponse(responseCode = "401", description = "API Key ausente ou inválida",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Carta não encontrada na TCGdex",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/cartas/{id}")
    public ResponseEntity<EntityModel<TcgdexCartaDto>> buscarCartaPorId(
            @Parameter(description = "ID externo da carta na TCGdex", example = "base1-4")
            @PathVariable String id) {
        TcgdexCartaDto carta = tcgdexClient.buscarCartaPorId(id);
        EntityModel<TcgdexCartaDto> model = EntityModel.of(carta,
                linkTo(methodOn(TcgdexController.class).buscarCartaPorId(id)).withSelfRel(),
                linkTo(methodOn(TcgdexController.class).listarCartas(Pageable.unpaged())).withRel("listar_todas"));
        return ResponseEntity.ok(model);
    }

    @Operation(
        summary = "Lista coleções da TCGdex",
        description = "Consulta o endpoint GET /v2/en/sets da TCGdex e retorna a lista paginada."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de coleções da TCGdex"),
            @ApiResponse(responseCode = "401", description = "API Key ausente ou inválida",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/colecoes")
    public ResponseEntity<PagedModel<EntityModel<TcgdexColecaoResumidaDto>>> listarColecoes(
            @ParameterObject Pageable pageable) {
        List<TcgdexColecaoResumidaDto> todas = tcgdexClient.listarColecoes();

        int inicio = (int) pageable.getOffset();
        int fim = Math.min(inicio + pageable.getPageSize(), todas.size());
        List<TcgdexColecaoResumidaDto> paginaAtual = (inicio > todas.size())
                ? List.of()
                : todas.subList(inicio, fim);

        Page<TcgdexColecaoResumidaDto> page = new PageImpl<>(paginaAtual, pageable, todas.size());
        PagedModel<EntityModel<TcgdexColecaoResumidaDto>> pagedModel = colecaoPagedAssembler.toModel(page,
                colecao -> EntityModel.of(colecao,
                        linkTo(methodOn(TcgdexController.class).buscarColecaoPorId(colecao.id())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(
        summary = "Busca detalhes de uma coleção na TCGdex",
        description = "Consulta o endpoint GET /v2/en/sets/{id} da TCGdex, "
                + "retornando os detalhes completos incluindo a lista de cartas da coleção."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleção encontrada na TCGdex"),
            @ApiResponse(responseCode = "401", description = "API Key ausente ou inválida",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada na TCGdex",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/colecoes/{id}")
    public ResponseEntity<EntityModel<TcgdexColecaoDto>> buscarColecaoPorId(
            @Parameter(description = "ID externo da coleção na TCGdex", example = "base1")
            @PathVariable String id) {
        TcgdexColecaoDto colecao = tcgdexClient.buscarColecaoPorId(id);
        EntityModel<TcgdexColecaoDto> model = EntityModel.of(colecao,
                linkTo(methodOn(TcgdexController.class).buscarColecaoPorId(id)).withSelfRel(),
                linkTo(methodOn(TcgdexController.class).listarColecoes(Pageable.unpaged())).withRel("listar_todas"));
        return ResponseEntity.ok(model);
    }

    @Operation(
        summary = "Busca cartas na TCGdex por nome",
        description = "Filtra localmente a lista completa da TCGdex pelo nome informado (após buscar tudo da API externa)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultados da busca"),
            @ApiResponse(responseCode = "401", description = "API Key ausente ou inválida",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/cartas/buscar")
    public ResponseEntity<PagedModel<EntityModel<TcgdexCartaResumidaDto>>> buscarCartasPorNome(
            @Parameter(description = "Termo de busca pelo nome", example = "Charizard")
            @RequestParam String nome,
            @ParameterObject Pageable pageable) {
        List<TcgdexCartaResumidaDto> filtradas = tcgdexClient.listarCartas()
                .stream()
                .filter(c -> c.name() != null && c.name().toLowerCase().contains(nome.toLowerCase()))
                .toList();

        int inicio = (int) pageable.getOffset();
        int fim = Math.min(inicio + pageable.getPageSize(), filtradas.size());
        List<TcgdexCartaResumidaDto> paginaAtual = (inicio > filtradas.size())
                ? List.of()
                : filtradas.subList(inicio, fim);

        Page<TcgdexCartaResumidaDto> page = new PageImpl<>(paginaAtual, pageable, filtradas.size());
        PagedModel<EntityModel<TcgdexCartaResumidaDto>> pagedModel = cartaPagedAssembler.toModel(page,
                carta -> EntityModel.of(carta,
                        linkTo(methodOn(TcgdexController.class).buscarCartaPorId(carta.id())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }
}
