package ept.edu.sn.alumni_backend.stage.entity;

import ept.edu.sn.alumni_backend.stage.AvisOrganisme;
import ept.edu.sn.alumni_backend.stage.StatutCandidature;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.StatutStage;
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
    public static class StatutCandidatureConverter implements AttributeConverter<StatutCandidature, String> {
        @Override
        public String convertToDatabaseColumn(StatutCandidature statut) {
            return statut == null ? null : statut.name();
        }

        @Override
        public StatutCandidature convertToEntityAttribute(String valeur) {
            return valeur == null ? null : StatutCandidature.valueOf(valeur);
        }
    }

    @Converter
    public static class AvisOrganismeConverter implements AttributeConverter<AvisOrganisme, String> {
        @Override
        public String convertToDatabaseColumn(AvisOrganisme avis) {
            return avis == null ? null : avis.name();
        }

        @Override
        public AvisOrganisme convertToEntityAttribute(String valeur) {
            return valeur == null ? null : AvisOrganisme.valueOf(valeur);
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

    @Converter
    public static class StatutStageConverter implements AttributeConverter<StatutStage, String> {
        @Override
        public String convertToDatabaseColumn(StatutStage statut) {
            return statut == null ? null : statut.name();
        }

        @Override
        public StatutStage convertToEntityAttribute(String valeur) {
            return valeur == null ? null : StatutStage.valueOf(valeur);
        }
    }
}
