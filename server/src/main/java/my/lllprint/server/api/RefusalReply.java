package my.lllprint.server.api;

import java.util.Map;

/**
 * What a refused request replies with. The same shape every time, so one place
 * on the screen can read it.
 */
public record RefusalReply(String refusal, String message, Map<String, String> fields) {

	public static RefusalReply of(Refused refused) {
		return new RefusalReply(refused.refusal().code(), refused.getMessage(), refused.fields());
	}

}
