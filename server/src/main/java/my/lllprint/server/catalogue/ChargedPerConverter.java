package my.lllprint.server.catalogue;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keeps the stored value as piece or order, which is what the database checks (FR-1.6). */
@Converter(autoApply = true)
public class ChargedPerConverter implements AttributeConverter<ChargedPer, String> {

	@Override
	public String convertToDatabaseColumn(ChargedPer chargedPer) {
		return chargedPer == null ? null : chargedPer.code();
	}

	@Override
	public ChargedPer convertToEntityAttribute(String code) {
		return code == null ? null : ChargedPer.ofCode(code);
	}

}
