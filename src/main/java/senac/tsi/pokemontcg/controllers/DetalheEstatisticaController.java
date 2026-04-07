package senac.tsi.pokemontcg.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import senac.tsi.pokemontcg.entities.DetalheEstatistica;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.DetalheEstatisticaService;

import java.net.URI;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Tag(name = "Detalhes Estatísticos", description = "CRUD para detalhes e estatísticas de cartas (relação 1:1 com Carta)")
@RestController
@RequestMapping("/detalhes")
public class DetalheEstatisticaController {

    private final DetalheEstatisticaService detalheService;
    private final PagedResourcesAssembler<DetalheEstatistica> pagedAssembler;

    @Autowired
    public DetalheEstatisticaController(DetalheEstatisticaService detalheService,
                                         PagedResourcesAssembler<DetalheEstatistica> pagedAssembler) {
        this.detalheService = detalheService;
        this.pagedAssembler = pagedAssembler;
    }

    @Operation(summary = "Lista todos os detalhes estatísticos",
               description = "Retorna todos os detalhes cadastrados, com paginação.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<PagedModel<EntityModel<DetalheEstatistica>>> listarTodos(
            @ParameterObject Pageable pageable) {
        Page<DetalheEstatistica> detalhes = detalheService.listarTodos(pageable);
        PagedModel<EntityModel<DetalheEstatistica>> pagedModel = pagedAssembler.toModel(detalhes,
                d -> EntityModel.of(d,
                        linkTo(methodOn(DetalheEstatisticaController.class).buscarPorId(d.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Busca um detalhe estatístico por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhe encontrado"),
            @ApiResponse(responseCode = "404", description = "Detalhe não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<DetalheEstatistica>> buscarPorId(@PathVariable Long id) {
        DetalheEstatistica detalhe = detalheService.buscarPorId(id);
        EntityModel<DetalheEstatistica> model = EntityModel.of(detalhe,
                linkTo(methodOn(DetalheEstatisticaController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(DetalheEstatisticaController.class).listarTodos(Pageable.unpaged())).withRel("listar_todos"),
                linkTo(methodOn(DetalheEstatisticaController.class).atualizar(id, null)).withRel("atualizar"),
                linkTo(methodOn(DetalheEstatisticaController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Busca o detalhe estatístico de uma carta específica",
               description = "Retorna o detalhe estatístico associado à carta informada (relação 1:1).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhe encontrado"),
            @ApiResponse(responseCode = "404", description = "Carta ou detalhe não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/carta/{cartaId}")
    public ResponseEntity<EntityModel<DetalheEstatistica>> buscarPorCartaId(
            @Parameter(description = "ID da carta", example = "1")
            @PathVariable Long cartaId) {
        DetalheEstatistica detalhe = detalheService.buscarPorCartaId(cartaId);
        EntityModel<DetalheEstatistica> model = EntityModel.of(detalhe,
                linkTo(methodOn(DetalheEstatisticaController.class).buscarPorId(detalhe.getId())).withSelfRel(),
                linkTo(methodOn(CartaController.class).buscarPorId(cartaId)).withRel("carta"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Cria um detalhe estatístico para uma carta",
               description = "Cria e associa um DetalheEstatistica a uma Carta existente pelo cartaId.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Detalhe criado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Carta não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/carta/{cartaId}")
    public ResponseEntity<EntityModel<DetalheEstatistica>> criar(
            @Parameter(description = "ID da carta a associar", example = "1")
            @PathVariable Long cartaId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(examples = @ExampleObject(value = """
                            {
                              "raridade": "Rare Holo",
                              "artista": "Mitsuhiro Arita",
                              "descricao": "Spits fire that is hot enough to melt boulders.",
                              "evolucaoDe": "Charmeleon"
                            }""")))
            @Valid @RequestBody DetalheEstatistica detalhe) {
        DetalheEstatistica salvo = detalheService.criar(cartaId, detalhe);
        EntityModel<DetalheEstatistica> model = EntityModel.of(salvo,
                linkTo(methodOn(DetalheEstatisticaController.class).buscarPorId(salvo.getId())).withSelfRel(),
                linkTo(methodOn(CartaController.class).buscarPorId(cartaId)).withRel("carta"));
        return ResponseEntity.created(URI.create("/detalhes/" + salvo.getId())).body(model);
    }

    @Operation(summary = "Atualiza um detalhe estatístico")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhe atualizado"),
            @ApiResponse(responseCode = "404", description = "Detalhe não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<DetalheEstatistica>> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody DetalheEstatistica detalhe) {
        DetalheEstatistica atualizado = detalheService.atualizar(id, detalhe);
        EntityModel<DetalheEstatistica> model = EntityModel.of(atualizado,
                linkTo(methodOn(DetalheEstatisticaController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(DetalheEstatisticaController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Remove um detalhe estatístico")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Detalhe removido"),
            @ApiResponse(responseCode = "404", description = "Detalhe não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        detalheService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Busca detalhes por nome do artista",
               description = "Busca parcial pelo nome do ilustrador da carta (case-insensitive).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultados da busca"),
            @ApiResponse(responseCode = "400", description = "Parâmetro 'artista' não informado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/buscar")
    public ResponseEntity<PagedModel<EntityModel<DetalheEstatistica>>> buscarPorArtista(
            @Parameter(description = "Nome do artista", example = "Arita")
            @RequestParam String artista,
            @ParameterObject Pageable pageable) {
        Page<DetalheEstatistica> detalhes = detalheService.buscarPorArtista(artista, pageable);
        PagedModel<EntityModel<DetalheEstatistica>> pagedModel = pagedAssembler.toModel(detalhes,
                d -> EntityModel.of(d,
                        linkTo(methodOn(DetalheEstatisticaController.class).buscarPorId(d.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }
}
