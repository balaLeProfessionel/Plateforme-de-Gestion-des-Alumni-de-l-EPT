package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import ept.edu.sn.alumni_backend.notification.MigrationTypesNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;

/** Une base créée avant l'ajout d'un type de notification retrouve une contrainte qui l'accepte. */
@SpringBootTest
class MigrationTypesNotificationTests {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private MigrationTypesNotification migration;

    @Test
    void laContrainteFigeeSurLesAnciensTypesEstRemplaceeParCelleDeLEnumeration() {
        // État d'une base créée avant la messagerie : MESSAGE y est refusé.
        jdbcTemplate.execute("alter table notifications drop constraint if exists notifications_type_check");
        jdbcTemplate.execute("alter table notifications add constraint notifications_type_check"
            + " check (type in ('MENTORAT', 'EVENEMENT', 'COMPTE'))");

        migration.run(new DefaultApplicationArguments());
        migration.run(new DefaultApplicationArguments()); // idempotente

        String clause = jdbcTemplate.queryForObject(
            "select check_clause from information_schema.check_constraints"
                + " where upper(constraint_name) = 'NOTIFICATIONS_TYPE_CHECK'", String.class);
        for (TypeNotification type : TypeNotification.values()) {
            assertThat(clause).contains("'" + type.name() + "'");
        }
    }
}
