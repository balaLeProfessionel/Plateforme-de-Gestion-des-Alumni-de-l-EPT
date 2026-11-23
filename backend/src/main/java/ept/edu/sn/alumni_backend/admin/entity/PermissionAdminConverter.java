package ept.edu.sn.alumni_backend.admin.entity;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Stocke une responsabilité en texte, sans la contrainte CHECK qu'Hibernate pose sur une colonne @Enumerated :
 * avec ddl-auto=update, elle ne serait jamais mise à jour et refuserait chaque responsabilité ajoutée avec un module.
 */
@Converter
public class PermissionAdminConverter implements AttributeConverter<PermissionAdmin, String> {
    @Override
    public String convertToDatabaseColumn(PermissionAdmin permission) {
        return permission == null ? null : permission.name();
    }

    @Override
    public PermissionAdmin convertToEntityAttribute(String valeur) {
        return valeur == null ? null : PermissionAdmin.valueOf(valeur);
    }
}
