package ept.edu.sn.alumni_backend.filiere.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import lombok.RequiredArgsConstructor;

/**
 * Filières au démarrage (TRA-14), idempotent :
 * 1. une base sans filière reçoit les cinq filières de l'école ;
 * 2. une base d'avant TRA-14 avait la filière en texte libre dans utilisateur.filiere : chaque texte est rattaché à
 *    la filière de même clé (casse, accents et espaces ignorés), ou en crée une, puis l'ancienne colonne est supprimée.
 * Une filière modifiée ensuite par l'administration n'est jamais réécrite.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class MigrationFilieres implements ApplicationRunner {
    static final List<String> FILIERES_DE_DEPART = List.of(
        "Génie Informatique et Télécommunications",
        "Génie Civil",
        "Génie Électromécanique",
        "Génie Industriel",
        "Génie Aéronautique et Aérospatial");
    private static final Logger LOGGER = LoggerFactory.getLogger(MigrationFilieres.class);

    private final FiliereRepository filiereRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        if (filiereRepository.count() == 0) {
            FILIERES_DE_DEPART.forEach(nom -> filiereRepository.save(new Filiere(nom, null)));
            filiereRepository.flush();
        }
        if (ancienneColonnePresente()) {
            reprendreAnciensTextes();
        }
    }

    private boolean ancienneColonnePresente() {
        Integer nombre = jdbcTemplate.queryForObject("""
            select count(*) from information_schema.columns
            where lower(table_name) = 'utilisateur' and lower(column_name) = 'filiere'
            """, Integer.class);
        return nombre != null && nombre > 0;
    }

    private void reprendreAnciensTextes() {
        List<String> textes = jdbcTemplate.queryForList(
            "select distinct filiere from utilisateur where filiere is not null and trim(filiere) <> ''", String.class);
        for (String texte : textes) {
            Filiere filiere = filiereRepository.findByCle(Filiere.cle(texte))
                .orElseGet(() -> {
                    LOGGER.info("Filière « {} » reprise des comptes existants.", Filiere.nettoyer(texte));
                    return filiereRepository.saveAndFlush(new Filiere(texte, null));
                });
            jdbcTemplate.update("update utilisateur set filiere_id = ? where filiere = ? and filiere_id is null", filiere.getId(), texte);
        }
        jdbcTemplate.execute("alter table utilisateur drop column filiere");
        LOGGER.info("Filières : {} libellé(s) repris, ancienne colonne utilisateur.filiere supprimée.", textes.size());
    }
}
