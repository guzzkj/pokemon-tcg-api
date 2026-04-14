package senac.tsi.pokemontcg.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.ConstraintViolationException;

/**
 * Centraliza o tratamento de exceções — intercepta erros de qualquer controller
 * e retorna um ErrorResponse padronizado.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleRecursoNaoEncontrado(RecursoNaoEncontradoException ex) {
        return new ErrorResponse(404, "Recurso não encontrado", ex.getMessage());
    }

    @ExceptionHandler(TcgdexNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleTcgdexNaoEncontrado(TcgdexNaoEncontradoException ex) {
        return new ErrorResponse(404, "Recurso não encontrado na API TCGdex", ex.getMessage());
    }

    @ExceptionHandler(ErroIntegracaoExternaException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ErrorResponse handleErroIntegracao(ErroIntegracaoExternaException ex) {
        return new ErrorResponse(502, "Erro de integração com serviço externo (TCGdex)", ex.getMessage());
    }

    // Coleta todas as mensagens de @NotBlank, @NotNull, @Size, etc.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidacao(MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return new ErrorResponse(400, "Dados inválidos na requisição", mensagem);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleConstraintViolation(ConstraintViolationException ex) {
        return new ErrorResponse(400, "Dados inválidos na requisição", ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDataIntegrity(DataIntegrityViolationException ex) {
        return new ErrorResponse(409, "Conflito de dados", "O recurso já existe ou viola uma restrição única.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleNotReadable(HttpMessageNotReadableException ex) {
        return new ErrorResponse(400, "Corpo da requisição mal formatado ou tipos de dados inválidos", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return new ErrorResponse(400, "Parâmetro da URL com formato/tipo inválido", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGenerico(Exception ex) {
        log.error("Erro interno não tratado", ex);
        return new ErrorResponse(500, "Erro interno do servidor", "Ocorreu um erro inesperado. Tente novamente mais tarde.");
    }
}
