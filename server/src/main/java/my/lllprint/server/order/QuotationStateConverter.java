package my.lllprint.server.order;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keeps the stored value as one of the five names in the check constraint (FR-2.1). */
@Converter(autoApply = true)
public class QuotationStateConverter implements AttributeConverter<QuotationState, String> {

	@Override
	public String convertToDatabaseColumn(QuotationState state) {
		return state == null ? null : state.code();
	}

	@Override
	public QuotationState convertToEntityAttribute(String code) {
		return code == null ? null : QuotationState.ofCode(code);
	}

}
