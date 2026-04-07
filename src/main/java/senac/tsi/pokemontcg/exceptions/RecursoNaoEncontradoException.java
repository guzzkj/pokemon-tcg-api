package senac.tsi.pokemontcg.exceptions;

/**
 * Lançada quando um recurso do NOSSO banco de dados (H2) não é encontrado.
 * O GlobalExceptionHandler a mapeia para HTTP 404.
 *
 * Exemplo de uso:
 *   throw new RecursoNaoEncontradoException("Carta com id 99 não encontrada.");
 */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
