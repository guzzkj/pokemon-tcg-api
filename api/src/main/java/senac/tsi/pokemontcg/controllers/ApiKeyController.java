package senac.tsi.pokemontcg.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import senac.tsi.pokemontcg.entities.ApiKey;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.ApiKeyService;

import java.net.URI;

@Tag(name = "API Keys", description = "Geração de chaves de autenticação")
@RestController
@RequestMapping("/api-keys")
@Validated
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @Autowired
    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @Operation(
        summary = "Gera uma nova API Key",
        description = "Cria e persiste uma nova chave de autenticação vinculada ao nome do cliente. "
                + "Use a chave retornada no header X-API-Key em todas as demais requisições."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "API Key gerada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetro nomeCliente ausente ou inválido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Limite de requisições excedido",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<ApiKey> gerar(
            @RequestParam @NotBlank(message = "nomeCliente é obrigatório") String nomeCliente) {
        ApiKey apiKey = apiKeyService.gerar(nomeCliente);
        return ResponseEntity
                .created(URI.create("/api-keys/" + apiKey.getId()))
                .body(apiKey);
    }
}
