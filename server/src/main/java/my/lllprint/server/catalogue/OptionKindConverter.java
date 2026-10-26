package my.lllprint.server.catalogue;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keeps the stored value as one of the seven names in the check constraint (FR-12.1). */
@Converter(autoApply = true)
public class OptionKindConverter implements AttributeConverter<OptionKind, String> {

	@Override
	public String convertToDatabaseColumn(OptionKind kind) {
		return kind == null ? null : kind.code();
	}

	@Override
	public OptionKind convertToEntityAttribute(String code) {
		return code == null ? null : OptionKind.ofCode(code);
	}

}
