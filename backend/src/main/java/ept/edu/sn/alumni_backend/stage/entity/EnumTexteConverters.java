package ept.edu.sn.alumni_backend.stage.entity;

import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Énumérations des stages stockées en texte (leur nom). Hibernate pose malgré tout une contrainte CHECK figée sur la
 * colonne : SuppressionContraintesEnum la retire au démarrage, pour accepter les statuts des tranches suivantes.
 */
public final class EnumTexteConverters {
    private EnumTexteConverters() {
    }

    @Converter
    public static class StatutOffreConverter implements AttributeConverter<StatutOffre, String> {
        @Override
        public String convertToDatabaseColumn(StatutOffre statut) {
            return statut == null ? null : statut.name();
        }

        @Override
        public StatutOffre convertToEntityAttribute(String valeur) {
            return valeur == null ? null : StatutOffre.valueOf(valeur);
        }
    }

    @Converter
    public static class TypeStageConverter implements AttributeConverter<TypeStage, String> {
        @Override
        public String convertToDatabaseColumn(TypeStage type) {
            return type == null ? null : type.name();
        }

        @Override
        public TypeStage convertToEntityAttribute(String valeur) {
            return valeur == null ? null : TypeStage.valueOf(valeur);
        }
    }
}
