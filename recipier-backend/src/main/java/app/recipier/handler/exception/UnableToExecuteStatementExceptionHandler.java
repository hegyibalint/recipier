package app.recipier.handler.exception;

import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.server.exceptions.ExceptionHandler;
import jakarta.inject.Singleton;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

import java.sql.SQLException;

@Produces
@Singleton
public class UnableToExecuteStatementExceptionHandler implements ExceptionHandler<UnableToExecuteStatementException, HttpResponse<?>> {

    @Override
    public HttpResponse<?> handle(HttpRequest request, UnableToExecuteStatementException exception) {
        if (exception.getCause() instanceof SQLException cause) {
            var state = cause.getSQLState();
            if ("23505".equals(state)) {
                return HttpResponse.badRequest();
            } else {
                return HttpResponse.serverError();
            }
        } else {
            return HttpResponse.serverError();
        }
    }

}
