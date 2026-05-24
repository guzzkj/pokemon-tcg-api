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
import senac.tsi.pokemontcg.dto.CartaV2Response;
import senac.tsi.pokemontcg.entities.Carta;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.CartaService;

import java.net.URI;
import java.util.Set;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Tag(name = "Cartas", description = "CRUD e operações especiais para cartas do Pokémon TCG")
@RestController
@RequestMapping("/cartas")
@org.springframework.validation.annotation.Validated
public class CartaController {

    private static final Set<String> VERSOES_SUPORTADAS = Set.of("v1", "v2");

    private final CartaService cartaService;
    private final PagedResourcesAssembler<Carta> pagedAssembler;

    @Autowired
    public CartaController(CartaService cartaService,
                           PagedResourcesAssembler<Carta> pagedAssembler) {
        this.cartaService = cartaService;
        this.pagedAssembler = pagedAssembler;
    }


    @Operation(
        summary = "Lista todas as cartas",
        description = "Retorna todas as cartas cadastradas no banco, com paginação. "
                + "Use os parâmetros: ?page=0&size=10&sort=nome,asc"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<PagedModel<EntityModel<Carta>>> listarTodas(
            @ParameterObject Pageable pageable) {
        Page<Carta> cartas = cartaService.listarTodas(pageable);
        PagedModel<EntityModel<Carta>> pagedModel = pagedAssembler.toModel(cartas,
                carta -> EntityModel.of(carta,
                        linkTo(methodOn(CartaController.class).buscarPorId(carta.getId(), "v1")).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }


    @Operation(
        summary = "Busca uma carta por ID",
        description = "Retorna os dados completos de uma carta específica. "
                + "Use o header **X-API-Version** para selecionar a versão da resposta:\n\n"
                + "- `v1` (padrão): campos base da carta\n"
                + "- `v2`: mesmos campos + `nomeCompleto` (ex: \"Charizard (POKEMON · 120 HP)\")"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Carta encontrada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Versão de API não suportada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Carta não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(
            @Parameter(description = "ID interno da carta", example = "1")
            @PathVariable @jakarta.validation.constraints.Positive Long id,
            @Parameter(description = "Versão da API (v1 ou v2)", example = "v1")
            @RequestHeader(value = "X-API-Version", defaultValue = "v1") String versao) {

        if (!VERSOES_SUPORTADAS.contains(versao.toLowerCase())) {
            ErrorResponse erro = new ErrorResponse(400, "Versão não suportada",
                    "X-API-Version '" + versao + "' inválida. Versões suportadas: v1, v2.");
            return ResponseEntity.badRequest().body(erro);
        }

        Carta carta = cartaService.buscarPorId(id);

        if ("v2".equalsIgnoreCase(versao)) {
            CartaV2Response dto = CartaV2Response.de(carta);
            EntityModel<CartaV2Response> model = EntityModel.of(dto,
                    linkTo(methodOn(CartaController.class).buscarPorId(id, versao)).withSelfRel(),
                    linkTo(methodOn(CartaController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"));
            return ResponseEntity.ok(model);
        }

        EntityModel<Carta> model = EntityModel.of(carta,
                linkTo(methodOn(CartaController.class).buscarPorId(id, versao)).withSelfRel(),
                linkTo(methodOn(CartaController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"),
                linkTo(methodOn(CartaController.class).atualizar(id, null)).withRel("atualizar"),
                linkTo(methodOn(CartaController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }


    @Operation(
        summary = "Cria uma nova carta",
        description = "Cadastra uma nova carta no banco de dados. "
                + "O campo 'categoria' deve ser: POKEMON, TREINADOR ou ENERGIA."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Carta criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos (campos obrigatórios faltando ou formato errado)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<EntityModel<Carta>> criar(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Dados da carta a ser criada",
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "nome": "Charizard",
                                      "categoria": "POKEMON",
                                      "pontosDeVida": 120,
                                      "imagemUrl": "https://assets.tcgdex.net/pt/base/base1/4/high.png",
                                      "numeroLocal": "4",
                                      "idExterno": "base1-4"
                                    }""")))
            @Valid @RequestBody Carta carta) {
        Carta salva = cartaService.criar(carta);
        EntityModel<Carta> model = EntityModel.of(salva,
                linkTo(methodOn(CartaController.class).buscarPorId(salva.getId(), "v1")).withSelfRel(),
                linkTo(methodOn(CartaController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"));
        return ResponseEntity.created(URI.create("/cartas/" + salva.getId())).body(model);
    }


    @Operation(
        summary = "Atualiza uma carta existente",
        description = "Atualiza todos os dados de uma carta identificada pelo ID."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Carta atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Carta não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<Carta>> atualizar(
            @PathVariable @jakarta.validation.constraints.Positive Long id,
            @Valid @RequestBody Carta carta) {
        Carta atualizada = cartaService.atualizar(id, carta);
        EntityModel<Carta> model = EntityModel.of(atualizada,
                linkTo(methodOn(CartaController.class).buscarPorId(id, "v1")).withSelfRel(),
                linkTo(methodOn(CartaController.class).listarTodas(Pageable.unpaged())).withRel("listar_todas"),
                linkTo(methodOn(CartaController.class).deletar(id)).withRel("deletar"));
        return ResponseEntity.ok(model);
    }


    @Operation(
        summary = "Remove uma carta",
        description = "Remove permanentemente uma carta do banco de dados. Retorna 204 sem corpo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "404", description = "Carta não encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable @jakarta.validation.constraints.Positive Long id) {
        cartaService.deletar(id);
        return ResponseEntity.noContent().build();
    }


    @Operation(
        summary = "Busca cartas por nome",
        description = "Busca parcial e case-insensitive pelo nome. Ex: ?nome=char retorna Charizard, Charmander, etc."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultados da busca"),
            @ApiResponse(responseCode = "400", description = "Parâmetro 'nome' inválido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/buscar")
    public ResponseEntity<PagedModel<EntityModel<Carta>>> buscarPorNome(
            @Parameter(description = "Termo de busca", example = "Charizard")
            @RequestParam @jakarta.validation.constraints.Size(min = 2, max = 100, message = "O termo de busca deve ter no mínimo 2 caracteres") String nome,
            @ParameterObject Pageable pageable) {
        Page<Carta> cartas = cartaService.buscarPorNome(nome, pageable);
        PagedModel<EntityModel<Carta>> pagedModel = pagedAssembler.toModel(cartas,
                carta -> EntityModel.of(carta,
                        linkTo(methodOn(CartaController.class).buscarPorId(carta.getId(), "v1")).withSelfRel()));
        return ResponseEntity.ok(pagedModel);
    }


}
