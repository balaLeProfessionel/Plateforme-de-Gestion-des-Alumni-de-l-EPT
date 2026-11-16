package ept.edu.sn.alumni_backend.notification;

import java.util.Arrays;
import java.util.stream.Collectors;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Aligne la contrainte CHECK de {@code notifications.type} sur {@link TypeNotification}. Hibernate
 * (ddl-auto=update) la fige à la création de la table et ne la met jamais à jour : un type ajouté
 * ensuite (MESSAGE) était refusé par PostgreSQL. Idempotent : la contrainte est recréée à chaque
 * démarrage depuis l'énumération, dans une seule transaction.
 */
@Component
@RequiredArgsConstructor
public class MigrationTypesNotification implements ApplicationRunner {
    static final String CONTRAINTE = "notifications_type_check";

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        // Les valeurs viennent de l'énumération, jamais d'une saisie : la concaténation est sans risque.
        String types = Arrays.stream(TypeNotification.values())
                .map(type -> "'" + type.name() + "'")
                .collect(Collectors.joining(", "));
        jdbcTemplate.execute("alter table notifications drop constraint if exists " + CONTRAINTE);
        jdbcTemplate.execute("alter table notifications add constraint " + CONTRAINTE + " check (type in (" + types + "))");
    }
}
