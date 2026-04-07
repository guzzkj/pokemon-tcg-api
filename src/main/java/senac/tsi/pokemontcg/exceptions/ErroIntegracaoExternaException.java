package senac.tsi.pokemontcg.exceptions;

/**
 * Lançada quando a API EXTERNA TCGdex retorna HTTP 5xx ou quando ocorre
 * uma falha de rede/timeout ao tentar se comunicar com ela.
 * O GlobalExceptionHandler a mapeia para HTTP 500 (Internal Server Error).
 */
public class ErroIntegracaoExternaException extends RuntimeException {

    public ErroIntegracaoExternaException(String mensagem) {
        super(mensagem);
    }
}
