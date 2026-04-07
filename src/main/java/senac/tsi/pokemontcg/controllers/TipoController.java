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
import senac.tsi.pokemontcg.entities.Tipo;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.TipoService;

import java.net.URI;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Tag(name = "Tipos", description = "CRUD para tipos de energia das cartas Pokémon (relação N:N com Carta)")
@RestController
@RequestMapping("/tipos")
public class TipoController {

    private final TipoService tipoService;
    private final PagedResourcesAssembler<Tipo> pagedAssembler;

    @Autowired
    public TipoController(TipoService tipoService,
                          PagedResourcesAssembler<Tipo> pagedAssembler) {
        this.tipoService = tipoService;
        this.pagedAssembler = pagedAssembler;
    }

    @Operation(summary = "Lista todos os tipos", description = "Retorna todos os tipos de energia cadastrados, com paginação.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<PagedModel<EntityModel<Tipo>>> listarTodos(
            @ParameterObject Pageable pageable) {
        Page<Tipo> tipos = tipoService.listarTodos(pageable);
        PagedModel<EntityModel<Tipo>> pagedModel = pagedAssembler.toModel(tipos,
                t -> EntityModel.of(t,
                        linkTo(methodOn(TipoController.class).buscarPorId(t.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Busca um tipo por ID",
               description = "Retorna o tipo com a lista de cartas associadas e links HATEOAS.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tipo encontrado"),
            @ApiResponse(responseCode = "404", description = "Tipo não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<Tipo>> buscarPorId(@PathVariable Long id) {
        Tipo tipo = tipoService.buscarPorId(id);
        EntityModel<Tipo> model = EntityModel.of(tipo,
                linkTo(methodOn(TipoController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(TipoController.class).listarTodos(Pageable.unpaged())).withRel("listar_todos"),
                linkTo(methodOn(TipoController.class).atualizar(id, null)).withRel("atualizar"),
                linkTo(methodOn(TipoController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Cria um novo tipo de energia",
               description = "Cadastra um novo tipo (ex: Fogo, Água, Grama, Psíquico).")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tipo criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<EntityModel<Tipo>> criar(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    content = @Content(examples = @ExampleObject(value = "{ \"nome\": \"Fogo\" }")))
            @Valid @RequestBody Tipo tipo) {
        Tipo salvo = tipoService.criar(tipo);
        EntityModel<Tipo> model = EntityModel.of(salvo,
                linkTo(methodOn(TipoController.class).buscarPorId(salvo.getId())).withSelfRel(),
                linkTo(methodOn(TipoController.class).listarTodos(Pageable.unpaged())).withRel("listar_todos"));
        return ResponseEntity.created(URI.create("/tipos/" + salvo.getId())).body(model);
    }

    @Operation(summary = "Atualiza um tipo existente",
               description = "Atualiza o nome de um tipo de energia identificado pelo ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tipo atualizado"),
            @ApiResponse(responseCode = "404", description = "Tipo não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<Tipo>> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Tipo tipo) {
        Tipo atualizado = tipoService.atualizar(id, tipo);
        EntityModel<Tipo> model = EntityModel.of(atualizado,
                linkTo(methodOn(TipoController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(TipoController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Remove um tipo")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Tipo removido"),
            @ApiResponse(responseCode = "404", description = "Tipo não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        tipoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Busca tipos por nome",
               description = "Busca parcial e case-insensitive pelo nome do tipo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultados da busca"),
            @ApiResponse(responseCode = "400", description = "Parâmetro 'nome' não informado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/buscar")
    public ResponseEntity<PagedModel<EntityModel<Tipo>>> buscarPorNome(
            @Parameter(description = "Nome do tipo", example = "Fogo") @RequestParam String nome,
            @ParameterObject Pageable pageable) {
        Page<Tipo> tipos = tipoService.buscarPorNome(nome, pageable);
        PagedModel<EntityModel<Tipo>> pagedModel = pagedAssembler.toModel(tipos,
                t -> EntityModel.of(t,
                        linkTo(methodOn(TipoController.class).buscarPorId(t.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Adiciona uma carta a um tipo",
               description = "Cria a associação Many-to-Many entre Tipo e Carta (insere na tabela carta_tipo).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Carta adicionada ao tipo"),
            @ApiResponse(responseCode = "404", description = "Tipo ou Carta não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{tipoId}/cartas/{cartaId}")
    public ResponseEntity<EntityModel<Tipo>> adicionarCarta(
            @Parameter(description = "ID do tipo") @PathVariable Long tipoId,
            @Parameter(description = "ID da carta a associar") @PathVariable Long cartaId) {
        Tipo tipo = tipoService.adicionarCarta(tipoId, cartaId);
        EntityModel<Tipo> model = EntityModel.of(tipo,
                linkTo(methodOn(TipoController.class).buscarPorId(tipoId)).withSelfRel());
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Remove uma carta de um tipo",
               description = "Remove a associação Many-to-Many entre Tipo e Carta.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Associação removida com sucesso"),
            @ApiResponse(responseCode = "404", description = "Tipo ou Carta não encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{tipoId}/cartas/{cartaId}")
    public ResponseEntity<EntityModel<Tipo>> removerCarta(
            @PathVariable Long tipoId,
            @PathVariable Long cartaId) {
        Tipo tipo = tipoService.removerCarta(tipoId, cartaId);
        EntityModel<Tipo> model = EntityModel.of(tipo,
                linkTo(methodOn(TipoController.class).buscarPorId(tipoId)).withSelfRel());
        return ResponseEntity.ok(model);
    }
}
