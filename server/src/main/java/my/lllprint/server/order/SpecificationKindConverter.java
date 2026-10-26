package my.lllprint.server.order;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** material, printing_method or print_location, as the database stores them (FR-1.3). */
@Converter(autoApply = true)
public class SpecificationKindConverter implements AttributeConverter<OrderToPrice.SpecificationKind, String> {

	@Override
	public String convertToDatabaseColumn(OrderToPrice.SpecificationKind kind) {
		return kind == null ? null : kind.name().toLowerCase();
	}

	@Override
	public OrderToPrice.SpecificationKind convertToEntityAttribute(String code) {
		return code == null ? null : OrderToPrice.SpecificationKind.valueOf(code.toUpperCase());
	}

}
