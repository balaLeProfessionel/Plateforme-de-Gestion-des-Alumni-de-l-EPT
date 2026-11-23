package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import ept.edu.sn.alumni_backend.common.SuppressionContraintesEnum;

/** Une base créée avant la messagerie accepte ensuite les notifications de type MESSAGE. */
@SpringBootTest
class TypesNotificationTests {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private SuppressionContraintesEnum suppression;

    @Test
    void laContrainteFigeeSurLesAnciensTypesDisparaitAuDemarrage() {
        // État d'une base créée avant la messagerie : MESSAGE y est refusé.
        jdbcTemplate.execute("alter table notifications drop constraint if exists notifications_type_check");
        jdbcTemplate.execute("alter table notifications add constraint notifications_type_check"
            + " check (type in ('MENTORAT', 'EVENEMENT', 'COMPTE'))");

        suppression.run(new DefaultApplicationArguments());

        Integer restantes = jdbcTemplate.queryForObject(
            "select count(*) from information_schema.check_constraints"
                + " where upper(constraint_name) = 'NOTIFICATIONS_TYPE_CHECK'", Integer.class);
        assertThat(restantes).isZero();
    }
}
