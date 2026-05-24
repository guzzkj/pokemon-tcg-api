package senac.tsi.pokemontcg.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import senac.tsi.pokemontcg.exceptions.ErrorResponse;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Janela fixa: LIMITE requisições por JANELA_MS por IP.
 * Retorna 429 + Retry-After ao exceder.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int LIMITE = 60;
    private static final long JANELA_MS = 60_000;

    private record Contagem(AtomicInteger count, long windowStart) {}

    private final ConcurrentHashMap<String, Contagem> contagens = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    @Autowired
    public RateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = resolverIp(request);
        long agora = System.currentTimeMillis();

        Contagem contagem = contagens.compute(ip, (k, v) -> {
            if (v == null || agora - v.windowStart() >= JANELA_MS) {
                return new Contagem(new AtomicInteger(1), agora);
            }
            v.count().incrementAndGet();
            return v;
        });

        int atual = contagem.count().get();
        long resetEmSegundos = Math.max(0, (contagem.windowStart() + JANELA_MS - agora) / 1000);

        response.setHeader("X-RateLimit-Limit", String.valueOf(LIMITE));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, LIMITE - atual)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(resetEmSegundos));

        if (atual > LIMITE) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(resetEmSegundos));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            ErrorResponse erro = new ErrorResponse(
                    429,
                    "Limite de requisições excedido",
                    "Tente novamente em " + resetEmSegundos + " segundos."
            );
            response.getWriter().write(objectMapper.writeValueAsString(erro));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolverIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
