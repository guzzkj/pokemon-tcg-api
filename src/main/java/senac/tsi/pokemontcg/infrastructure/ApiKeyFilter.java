package senac.tsi.pokemontcg.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.ApiKeyService;

import java.io.IOException;
import java.util.Set;

@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    private static final Set<String> CAMINHOS_PUBLICOS = Set.of(
            "/api-keys",
            "/swagger-ui",
            "/v3/api-docs",
            "/h2-console"
    );

    private final ApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    @Autowired
    public ApiKeyFilter(ApiKeyService apiKeyService, ObjectMapper objectMapper) {
        this.apiKeyService = apiKeyService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return CAMINHOS_PUBLICOS.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String chave = request.getHeader("X-API-Key");

        if (chave == null || chave.isBlank() || !apiKeyService.validar(chave)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            ErrorResponse erro = new ErrorResponse(401, "Não autorizado", "Header X-API-Key ausente ou inválido.");
            response.getWriter().write(objectMapper.writeValueAsString(erro));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
