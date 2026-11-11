package ept.edu.sn.alumni_backend.common;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Hibernate pose une contrainte CHECK sur chaque colonne d'énumération, même stockée par un AttributeConverter, et
 * ddl-auto=update ne la met jamais à jour : la valeur ajoutée par une version suivante serait refusée par la base.
 * Ces contraintes sont retirées à chaque démarrage (idempotent, IF EXISTS) ; la valeur reste contrôlée par l'énumération.
 */
@Component
@RequiredArgsConstructor
public class SuppressionContraintesEnum implements ApplicationRunner {
    /** Colonnes d'énumérations appelées à grandir (statuts des stages, responsabilités d'administration). */
    static final List<String> CONTRAINTES = List.of(
        "offre_stage.offre_stage_statut_check",
        "offre_stage.offre_stage_type_stage_check",
        "candidature.candidature_statut_check",
        "candidature.candidature_avis_organisme_check",
        "utilisateur_permission_admin.utilisateur_permission_admin_permission_check");

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments arguments) {
        for (String contrainte : CONTRAINTES) {
            String[] parties = contrainte.split("\\.");
            jdbcTemplate.execute("alter table " + parties[0] + " drop constraint if exists " + parties[1]);
        }
    }
}
