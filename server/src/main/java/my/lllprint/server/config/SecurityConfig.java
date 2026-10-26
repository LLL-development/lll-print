package my.lllprint.server.config;

import java.io.IOException;
import java.time.Clock;

import tools.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

import my.lllprint.server.api.Refusal;
import my.lllprint.server.api.RefusalReply;
import my.lllprint.server.api.TokenFilter;
import my.lllprint.server.identity.SignInSettings;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * How a request is let in at all.
 *
 * <p>Two addresses answer without a token: signing in, and the customer
 * quotation link, which is readable without signing in and is the only such
 * address in the whole API (SEC-5, SDD section 6). Everything else requires a
 * signed-in account, and then requires the Admin role or a named grant on top
 * of that (SEC-1).
 */
@Configuration
@EnableConfigurationProperties(SignInSettings.class)
public class SecurityConfig {

	@Bean
	SecurityFilterChain api(HttpSecurity http, TokenFilter tokens, ObjectMapper json) throws Exception {
		return http
				// There is no cookie and no browser session, so there is nothing for a
				// cross-site form to ride on. The token is sent deliberately by our own
				// screens on every request.
				.csrf(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(requests -> requests
						.requestMatchers("/api/v1/sessions").permitAll()
						.requestMatchers("/api/v1/public/**").permitAll()
						.anyRequest().authenticated())
				.addFilterBefore(tokens, UsernamePasswordAuthenticationFilter.class)
				.exceptionHandling(handling -> handling
						.authenticationEntryPoint(refusalEntryPoint(json))
						.accessDeniedHandler(refusalDeniedHandler(json)))
				.build();
	}

	/** Hashed with bcrypt, and never readable back (SEC-6). */
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	/**
	 * One clock, so that what the server thinks the time is can be fixed in a
	 * test. Times are kept in UTC; the shop's own day is worked out in
	 * Asia/Kuala_Lumpur where it matters (NFR-2.3).
	 */
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

	private AuthenticationEntryPoint refusalEntryPoint(ObjectMapper json) {
		return (request, response, exception) -> write(response, json, Refusal.NOT_SIGNED_IN, "Sign in first.");
	}

	private AccessDeniedHandler refusalDeniedHandler(ObjectMapper json) {
		return (request, response, exception) -> write(response, json, Refusal.NOT_ALLOWED,
				"This account is not allowed to do that.");
	}

	private static void write(HttpServletResponse response, ObjectMapper json, Refusal refusal, String message)
			throws IOException {
		response.setStatus(refusal.status().value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		json.writeValue(response.getWriter(), new RefusalReply(refusal.code(), message, java.util.Map.of()));
	}

}
