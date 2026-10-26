package my.lllprint.server.identity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keeps the stored value as one of the eleven names in the check constraint (FR-10.2). */
@Converter(autoApply = true)
public class GrantActionConverter implements AttributeConverter<GrantAction, String> {

	@Override
	public String convertToDatabaseColumn(GrantAction action) {
		return action == null ? null : action.code();
	}

	@Override
	public GrantAction convertToEntityAttribute(String code) {
		return code == null ? null : GrantAction.ofCode(code);
	}

}
