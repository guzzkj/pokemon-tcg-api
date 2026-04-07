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
import senac.tsi.pokemontcg.entities.Serie;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.SerieService;

import java.net.URI;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Tag(name = "Séries", description = "CRUD para séries do Pokémon TCG e importação via TCGdex (relação 1:N com Coleção)")
@RestController
@RequestMapping("/series")
public class SerieController {

    private final SerieService serieService;
    private final PagedResourcesAssembler<Serie> pagedAssembler;

    @Autowired
    public SerieController(SerieService serieService,
                           PagedResourcesAssembler<Serie> pagedAssembler) {
        this.serieService = serieService;
        this.pagedAssembler = pagedAssembler;
    }

    @Operation(summary = "Lista todas as séries",
               description = "Retorna todas as séries cadastradas, com paginação.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<PagedModel<EntityModel<Serie>>> listarTodas(
            @ParameterObject Pageable pageable) {
        Page<Serie> series = serieService.listarTodas(pageable);
        PagedModel<EntityModel<Serie>> pagedModel = pagedAssembler.toModel(series,
                s -> EntityModel.of(s,
                        linkTo(methodOn(SerieController.class).buscarPorId(s.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Busca uma série por ID",
               description = "Retorna os dados de uma série com links HATEOAS de navegação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Série encontrada"),
            @ApiResponse(responseCode = "404", description = "Série não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<Serie>> buscarPorId(@PathVariable Long id) {
        Serie serie = serieService.buscarPorId(id);
        EntityModel<Serie> model = EntityModel.of(serie,
                linkTo(methodOn(SerieController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(SerieController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"),
                linkTo(methodOn(SerieController.class).atualizar(id, null)).withRel("atualizar"),
                linkTo(methodOn(SerieController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Cria uma nova série",
               description = "Cadastra uma nova série manualmente no banco de dados.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Série criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<EntityModel<Serie>> criar(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Dados da nova série",
                    content = @Content(examples = @ExampleObject(value = """
                            {
                              "nome": "Base",
                              "idExterno": "base",
                              "logoUrl": "https://assets.tcgdex.net/en/base/logo.png"
                            }""")))
            @Valid @RequestBody Serie serie) {
        Serie salva = serieService.criar(serie);
        EntityModel<Serie> model = EntityModel.of(salva,
                linkTo(methodOn(SerieController.class).buscarPorId(salva.getId())).withSelfRel(),
                linkTo(methodOn(SerieController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"));
        return ResponseEntity.created(URI.create("/series/" + salva.getId())).body(model);
    }

    @Operation(summary = "Atualiza uma série existente",
               description = "Atualiza nome, código externo e logo de uma série identificada pelo ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Série atualizada"),
            @ApiResponse(responseCode = "404", description = "Série não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<Serie>> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Serie serie) {
        Serie atualizada = serieService.atualizar(id, serie);
        EntityModel<Serie> model = EntityModel.of(atualizada,
                linkTo(methodOn(SerieController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(SerieController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Remove uma série")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Série removida"),
            @ApiResponse(responseCode = "404", description = "Série não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        serieService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Busca séries por nome",
               description = "Busca parcial e case-insensitive pelo nome da série.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultados da busca"),
            @ApiResponse(responseCode = "400", description = "Parâmetro 'nome' não informado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/buscar")
    public ResponseEntity<PagedModel<EntityModel<Serie>>> buscarPorNome(
            @Parameter(description = "Termo de busca", example = "Base") @RequestParam String nome,
            @ParameterObject Pageable pageable) {
        Page<Serie> series = serieService.buscarPorNome(nome, pageable);
        PagedModel<EntityModel<Serie>> pagedModel = pagedAssembler.toModel(series,
                s -> EntityModel.of(s,
                        linkTo(methodOn(SerieController.class).buscarPorId(s.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Importa uma série da API TCGdex",
               description = "Busca uma série na TCGdex pelo ID externo (ex: 'base') e a salva no banco local. "
                       + "Se a série já existir no banco, retorna a existente sem duplicar.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Série importada e salva com sucesso"),
            @ApiResponse(responseCode = "404", description = "Série não encontrada na TCGdex",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Falha de comunicação com a TCGdex",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/importar/{idExterno}")
    public ResponseEntity<EntityModel<Serie>> importarDaTcgdex(
            @Parameter(description = "ID externo da série na TCGdex", example = "base")
            @PathVariable String idExterno) {
        Serie importada = serieService.importarDaTcgdex(idExterno);
        EntityModel<Serie> model = EntityModel.of(importada,
                linkTo(methodOn(SerieController.class).buscarPorId(importada.getId())).withSelfRel(),
                linkTo(methodOn(SerieController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"));
        return ResponseEntity.created(URI.create("/series/" + importada.getId())).body(model);
    }
}
