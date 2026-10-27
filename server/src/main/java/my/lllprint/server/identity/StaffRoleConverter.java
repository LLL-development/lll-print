package my.lllprint.server.identity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keeps the stored value as {@code admin} or {@code staff}, which is what the database checks. */
@Converter(autoApply = true)
public class StaffRoleConverter implements AttributeConverter<StaffRole, String> {

	@Override
	public String convertToDatabaseColumn(StaffRole role) {
		return role == null ? null : role.code();
	}

	@Override
	public StaffRole convertToEntityAttribute(String code) {
		return code == null ? null : StaffRole.ofCode(code);
	}

}
