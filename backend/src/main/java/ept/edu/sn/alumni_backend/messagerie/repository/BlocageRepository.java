package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.messagerie.entity.Blocage;

public interface BlocageRepository extends JpaRepository<Blocage, UUID> {
    boolean existsByBloqueurIdAndBloqueId(UUID bloqueurId, UUID bloqueId);

    /** Les membres que j'ai bloqués, le plus récent d'abord. */
    @EntityGraph(attributePaths = "bloque")
    List<Blocage> findByBloqueurIdOrderByCreeLeDesc(UUID bloqueurId);

    @Modifying
    @Query("delete from Blocage blocage where blocage.bloqueur.id = :bloqueurId and blocage.bloque.id = :bloqueId")
    int supprimer(@Param("bloqueurId") UUID bloqueurId, @Param("bloqueId") UUID bloqueId);

    /** Les blocages où j'apparais d'un côté ou de l'autre : une seule requête pour toute une liste de conversations. */
    @Query("""
        select blocage.bloqueur.id as bloqueurId, blocage.bloque.id as bloqueId
        from Blocage blocage where blocage.bloqueur.id = :utilisateurId or blocage.bloque.id = :utilisateurId
        """)
    List<Paire> findPairesImpliquant(@Param("utilisateurId") UUID utilisateurId);

    interface Paire {
        UUID getBloqueurId();
        UUID getBloqueId();
    }
}
