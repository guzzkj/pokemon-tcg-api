package senac.tsi.pokemontcg.infrastructure;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;
import senac.tsi.pokemontcg.services.IdempotencyService;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {

    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @Autowired
    public IdempotencyFilter(IdempotencyService idempotencyService, ObjectMapper objectMapper) {
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Aplica somente a POSTs
        return !"POST".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String chave = request.getHeader("X-Idempotency-Key");

        if (chave == null || chave.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        if (chave.length() > 128) {
            response.setStatus(400);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            ErrorResponse erro = new ErrorResponse(400, "X-Idempotency-Key inválida",
                    "A chave de idempotência não pode exceder 128 caracteres.");
            response.getWriter().write(objectMapper.writeValueAsString(erro));
            return;
        }

        if (idempotencyService.jaProcessada(chave)) {
            response.setStatus(409);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            ErrorResponse erro = new ErrorResponse(409, "Requisição duplicada",
                    "A chave de idempotência '" + chave + "' já foi utilizada.");
            response.getWriter().write(objectMapper.writeValueAsString(erro));
            return;
        }

        filterChain.doFilter(request, response);

        // Registra a chave somente se o downstream processou com sucesso (2xx)
        // Erro 4xx/5xx = operação não concluída; cliente deve poder tentar novamente
        if (response.getStatus() < 300) {
            idempotencyService.registrar(chave, request.getRequestURI());
        }
    }
}
