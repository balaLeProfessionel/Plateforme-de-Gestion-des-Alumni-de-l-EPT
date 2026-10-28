package ept.edu.sn.alumni_backend.admin.entity;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Stocke le type d'une décision en texte, sans la contrainte CHECK qu'Hibernate pose sur une colonne
 * @Enumerated : avec ddl-auto=update, cette contrainte n'est jamais mise à jour et refuserait
 * chaque nouveau type de décision (création de compte, rôle, diplomation…).
 */
@Converter
public class TypeActionAdminConverter implements AttributeConverter<TypeActionAdmin, String> {
    @Override
    public String convertToDatabaseColumn(TypeActionAdmin type) {
        return type == null ? null : type.name();
    }

    @Override
    public TypeActionAdmin convertToEntityAttribute(String valeur) {
        return valeur == null ? null : TypeActionAdmin.valueOf(valeur);
    }
}
