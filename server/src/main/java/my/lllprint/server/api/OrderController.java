package my.lllprint.server.api;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import my.lllprint.server.order.OrderService;
import my.lllprint.server.order.TypedOrder;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The order form: starting one, saving it, and reading it back with its
 * running total (SDD section 6).
 *
 * <p>A draft quotation is the order being typed, so these are the same
 * addresses the quotation uses (FR-1.10, FR-2.1).
 *
 * <p>Typing an order is Admin's work (D-A). The customer never types one and
 * never signs in.
 */
@RestController
@RequestMapping("/api/v1/quotations")
public class OrderController {

	private final OrderService orders;

	private final CurrentAccount current;

	public OrderController(OrderService orders, CurrentAccount current) {
		this.orders = orders;
		this.current = current;
	}

	@GetMapping
	public List<OrderReply> list() {
		return orders.list(current.requireAdmin()).stream().map(OrderReply::summaryOf).toList();
	}

	@GetMapping("/{id}")
	public OrderReply one(@PathVariable Long id) {
		return OrderReply.of(orders.read(current.requireAdmin(), id));
	}

	/** Starts a draft. The job title is the first thing typed (FR-1.2). */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public OrderReply start(@Valid @RequestBody StartOrder request) {
		return OrderReply.summaryOf(orders.startDraft(current.requireAdmin(), request.jobTitle()));
	}

	/**
	 * Saves what has been typed and replies with the total worked out again from
	 * the lines.
	 *
	 * <p>The request carries no total. It says which options were chosen and how
	 * many, and the server does the arithmetic (SEC-7).
	 */
	@PutMapping("/{id}")
	public OrderReply save(@PathVariable Long id, @Valid @RequestBody TypedOrder typed) {
		return OrderReply.of(orders.save(current.requireAdmin(), id, typed));
	}

	/** All that is needed to start: what the order is called (FR-1.2). */
	public record StartOrder(@NotBlank(message = "Type the job title.") @Size(max = 200) String jobTitle) {
	}

}
