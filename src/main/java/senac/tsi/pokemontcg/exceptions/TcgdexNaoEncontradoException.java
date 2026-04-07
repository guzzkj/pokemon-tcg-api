package senac.tsi.pokemontcg.exceptions;

/**
 * Lançada quando a API EXTERNA TCGdex retorna HTTP 404 (recurso não encontrado).
 * Separada de RecursoNaoEncontradoException para distinguir a origem do erro:
 * erro no nosso banco vs. recurso inexistente na API de terceiro.
 * O GlobalExceptionHandler a mapeia para HTTP 404 com mensagem específica.
 */
public class TcgdexNaoEncontradoException extends RuntimeException {

    public TcgdexNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
