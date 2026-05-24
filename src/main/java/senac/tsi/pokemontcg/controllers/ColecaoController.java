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
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.entities.Colecao;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.CartaService;
import senac.tsi.pokemontcg.services.ColecaoService;

import java.net.URI;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Tag(name = "Coleções", description = "CRUD para coleções (sets) do Pokémon TCG")
@RestController
@RequestMapping("/colecoes")
public class ColecaoController {

    private final ColecaoService colecaoService;
    private final CartaService cartaService;
    private final PagedResourcesAssembler<Colecao> pagedAssembler;
    private final PagedResourcesAssembler<Carta> cartaPagedAssembler;

    @Autowired
    public ColecaoController(ColecaoService colecaoService,
                             CartaService cartaService,
                             PagedResourcesAssembler<Colecao> pagedAssembler,
                             PagedResourcesAssembler<Carta> cartaPagedAssembler) {
        this.colecaoService = colecaoService;
        this.cartaService = cartaService;
        this.pagedAssembler = pagedAssembler;
        this.cartaPagedAssembler = cartaPagedAssembler;
    }

    @Operation(summary = "Lista todas as coleções",
               description = "Retorna todas as coleções cadastradas, com paginação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<PagedModel<EntityModel<Colecao>>> listarTodas(
            @ParameterObject Pageable pageable) {
        Page<Colecao> colecoes = colecaoService.listarTodas(pageable);
        PagedModel<EntityModel<Colecao>> pagedModel = pagedAssembler.toModel(colecoes,
                c -> EntityModel.of(c,
                        linkTo(methodOn(ColecaoController.class).buscarPorId(c.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Busca uma coleção por ID",
               description = "Retorna os dados de uma coleção com links HATEOAS de navegação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleção encontrada"),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<Colecao>> buscarPorId(@PathVariable Long id) {
        Colecao colecao = colecaoService.buscarPorId(id);
        EntityModel<Colecao> model = EntityModel.of(colecao,
                linkTo(methodOn(ColecaoController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(ColecaoController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"),
                linkTo(methodOn(ColecaoController.class).listarCartasDaColecao(id, Pageable.unpaged())).withRel("cartas"),
                linkTo(methodOn(ColecaoController.class).atualizar(id, null)).withRel("atualizar"),
                linkTo(methodOn(ColecaoController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Cria uma nova coleção",
               description = "Cadastra uma nova coleção (set) de cartas no banco de dados.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Coleção criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<EntityModel<Colecao>> criar(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Dados da nova coleção",
                    content = @Content(examples = @ExampleObject(value = """
                            {
                              "nome": "Base Set",
                              "serie": "Base",
                              "codigoExterno": "base1",
                              "totalDeCartas": 102
                            }""")))
            @Valid @RequestBody Colecao colecao) {
        Colecao salva = colecaoService.criar(colecao);
        EntityModel<Colecao> model = EntityModel.of(salva,
                linkTo(methodOn(ColecaoController.class).buscarPorId(salva.getId())).withSelfRel(),
                linkTo(methodOn(ColecaoController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"));
        return ResponseEntity.created(URI.create("/colecoes/" + salva.getId())).body(model);
    }

    @Operation(summary = "Atualiza uma coleção existente",
               description = "Atualiza todos os dados de uma coleção identificada pelo ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleção atualizada"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<Colecao>> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Colecao colecao) {
        Colecao atualizada = colecaoService.atualizar(id, colecao);
        EntityModel<Colecao> model = EntityModel.of(atualizada,
                linkTo(methodOn(ColecaoController.class).buscarPorId(id)).withSelfRel(),
                linkTo(methodOn(ColecaoController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }

    @Operation(summary = "Remove uma coleção")
    @ApiResponses({
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        colecaoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Busca coleções por nome",
               description = "Busca parcial e case-insensitive pelo nome da coleção.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultados da busca"),
            @ApiResponse(responseCode = "400", description = "Parâmetro 'nome' não informado",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/buscar")
    public ResponseEntity<PagedModel<EntityModel<Colecao>>> buscarPorNome(
            @Parameter(description = "Termo de busca", example = "Base") @RequestParam String nome,
            @ParameterObject Pageable pageable) {
        Page<Colecao> colecoes = colecaoService.buscarPorNome(nome, pageable);
        PagedModel<EntityModel<Colecao>> pagedModel = pagedAssembler.toModel(colecoes,
                c -> EntityModel.of(c,
                        linkTo(methodOn(ColecaoController.class).buscarPorId(c.getId())).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }

    @Operation(summary = "Lista as cartas de uma coleção",
               description = "Retorna todas as cartas pertencentes a uma coleção específica, com paginação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de cartas da coleção"),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/cartas")
    public ResponseEntity<PagedModel<EntityModel<Carta>>> listarCartasDaColecao(
            @PathVariable Long id,
            @ParameterObject Pageable pageable) {
        colecaoService.buscarPorId(id);
        Page<Carta> cartas = cartaService.listarPorColecao(id, pageable);
        PagedModel<EntityModel<Carta>> pagedModel = cartaPagedAssembler.toModel(cartas,
                carta -> EntityModel.of(carta,
                        linkTo(methodOn(CartaController.class).buscarPorId(carta.getId(), "v1")).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }
}
