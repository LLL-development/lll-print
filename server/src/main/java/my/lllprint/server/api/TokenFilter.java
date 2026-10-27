package my.lllprint.server.api;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import my.lllprint.server.identity.AskingAccount;
import my.lllprint.server.identity.GrantAction;
import my.lllprint.server.identity.SignInService;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads the token off the request and decides who is asking, before any rule
 * runs and before any row is read (SDD section 2 and section 5).
 *
 * <p>A request with no token, or with a token that is no longer good, simply
 * arrives unsigned-in. Nothing is allowed by default, so the endpoint it was
 * aimed at refuses it (SEC-1).
 */
@Component
public class TokenFilter extends OncePerRequestFilter {

	private static final String HEADER = "Authorization";

	private static final String PREFIX = "Bearer ";

	private final SignInService signIn;

	public TokenFilter(SignInService signIn) {
		this.signIn = signIn;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader(HEADER);
		if (header != null && header.startsWith(PREFIX)
				&& SecurityContextHolder.getContext().getAuthentication() == null) {
			signIn.whoIsAsking(header.substring(PREFIX.length()).strip())
					.ifPresent(TokenFilter::rememberForThisRequest);
		}
		chain.doFilter(request, response);
	}

	private static void rememberForThisRequest(AskingAccount account) {
		List<GrantedAuthority> authorities = new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority("ROLE_" + account.role().name()));
		for (GrantAction action : account.grants()) {
			authorities.add(new SimpleGrantedAuthority(action.code()));
		}
		UsernamePasswordAuthenticationToken authentication =
				new UsernamePasswordAuthenticationToken(account, null, authorities);
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

}
