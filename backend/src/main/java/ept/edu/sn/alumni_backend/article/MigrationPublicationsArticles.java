package ept.edu.sn.alumni_backend.article;

import java.util.Arrays;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.JdbcUtils;
import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.publication.TypePublication;
import lombok.RequiredArgsConstructor;

/**
 * Bases PostgreSQL créées avant les articles : ddl-auto=update n'ajoute pas ARTICLE à la contrainte CHECK
 * figée sur publications.type, ni la contrainte de cohérence type/article_id. Idempotent ; sans effet sur H2,
 * où le schéma est recréé à chaque lancement.
 */
@Component
@RequiredArgsConstructor
public class MigrationPublicationsArticles implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments arguments) throws Exception {
        String base = JdbcUtils.extractDatabaseMetaData(dataSource, meta -> meta.getDatabaseProductName());
        if (!"PostgreSQL".equals(base)) return;
        String types = Arrays.stream(TypePublication.values()).map(t -> "'" + t.name() + "'").collect(Collectors.joining(","));
        jdbcTemplate.execute("alter table publications drop constraint if exists publications_type_check");
        jdbcTemplate.execute("alter table publications add constraint publications_type_check check (type in (" + types + "))");
        jdbcTemplate.execute("alter table publications drop constraint if exists ck_publications_article");
        jdbcTemplate.execute("alter table publications add constraint ck_publications_article check "
            + "((type = 'ARTICLE' and article_id is not null) or (type <> 'ARTICLE' and article_id is null))");
    }
}
