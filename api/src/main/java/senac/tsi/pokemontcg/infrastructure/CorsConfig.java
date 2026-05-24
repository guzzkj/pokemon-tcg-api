package senac.tsi.pokemontcg.infrastructure;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "https://guzzkj.github.io",
                        "http://localhost:3000",
                        "http://localhost:8080",
                        "http://localhost:5173"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders(
                        "Content-Type",
                        "Authorization",
                        "X-API-Key",
                        "X-Idempotency-Key",
                        "X-API-Version"
                )
                .exposedHeaders(
                        "Location",
                        "X-API-Version",
                        "X-RateLimit-Limit",
                        "X-RateLimit-Remaining",
                        "X-RateLimit-Reset",
                        "Retry-After"
                )
                .allowCredentials(false)
                .maxAge(3600);
    }
}
