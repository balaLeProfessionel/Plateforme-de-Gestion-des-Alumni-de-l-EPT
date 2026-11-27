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
    /** Colonnes d'énumérations appelées à grandir (statuts des stages et des mobilités, responsabilités d'administration, notifications). */
    static final List<String> CONTRAINTES = List.of(
        "offre_stage.offre_stage_statut_check",
        "offre_stage.offre_stage_type_stage_check",
        "candidature.candidature_statut_check",
        "candidature.candidature_avis_organisme_check",
        "stage.stage_statut_check",
        "stage.stage_type_stage_check",
        "utilisateur.utilisateur_classe_check",
        "utilisateur_permission_admin.utilisateur_permission_admin_permission_check",
        "notifications.notifications_type_check",
        "offre_mobilite.offre_mobilite_statut_check",
        "offre_mobilite.offre_mobilite_type_mobilite_check",
        "offre_mobilite_classe.offre_mobilite_classe_classe_check",
        "offre_mobilite_piece_demandee.offre_mobilite_piece_demandee_type_piece_check",
        "historique_mobilite.historique_mobilite_action_check",
        "candidature_mobilite.candidature_mobilite_statut_check",
        "piece_candidature_mobilite.piece_candidature_mobilite_type_piece_check",
        "offre_emploi.offre_emploi_statut_check",
        "offre_emploi.offre_emploi_mode_check",
        "offre_emploi.offre_emploi_type_contrat_check",
        "signalement_offre_emploi.signalement_offre_emploi_motif_check",
        "question_offre_emploi.question_offre_emploi_type_check",
        "candidature_emploi.candidature_emploi_statut_check",
        "mobilite.mobilite_statut_check",
        "mobilite.mobilite_type_mobilite_check");

    /**
     * Colonnes devenues facultatives : ddl-auto=update ne relâche jamais un NOT NULL déjà posé.
     * stage.organisme_id : une déclaration (STA-10) peut nommer un organisme encore inconnu de la plateforme.
     */
    static final List<String> COLONNES_FACULTATIVES = List.of("stage.organisme_id");

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments arguments) {
        for (String contrainte : CONTRAINTES) {
            String[] parties = contrainte.split("\\.");
            jdbcTemplate.execute("alter table " + parties[0] + " drop constraint if exists " + parties[1]);
        }
        for (String colonne : COLONNES_FACULTATIVES) {
            String[] parties = colonne.split("\\.");
            jdbcTemplate.execute("alter table " + parties[0] + " alter column " + parties[1] + " drop not null");
        }
    }
}
