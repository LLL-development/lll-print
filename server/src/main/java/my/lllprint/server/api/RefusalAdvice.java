package my.lllprint.server.api;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns everything that can go wrong into one of the named refusals, in one
 * place.
 *
 * <p>Validation happens once, at the edge, and its answer names the fields at
 * fault (SDD section 6).
 */
@RestControllerAdvice
public class RefusalAdvice {

	@ExceptionHandler(Refused.class)
	public ResponseEntity<RefusalReply> refused(Refused refused) {
		return ResponseEntity.status(refused.refusal().status()).body(RefusalReply.of(refused));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<RefusalReply> wrongShape(MethodArgumentNotValidException ex) {
		Map<String, String> fields = new LinkedHashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			fields.putIfAbsent(error.getField(), error.getDefaultMessage());
		}
		return refused(new Refused(Refusal.INVALID, "Some of what was sent cannot be used.", fields));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<RefusalReply> unreadable(HttpMessageNotReadableException ex) {
		return refused(new Refused(Refusal.INVALID, "The request could not be read."));
	}

	@ExceptionHandler(OptimisticLockingFailureException.class)
	public ResponseEntity<RefusalReply> movedOn(OptimisticLockingFailureException ex) {
		return refused(new Refused(Refusal.CHANGED_BY_SOMEONE_ELSE,
				"Someone else changed this since it was read. Look at it again before saving."));
	}

}
