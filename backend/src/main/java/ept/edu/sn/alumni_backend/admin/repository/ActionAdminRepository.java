package ept.edu.sn.alumni_backend.admin.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;

public interface ActionAdminRepository extends JpaRepository<ActionAdmin, UUID> {
    @EntityGraph(attributePaths = "admin")
    List<ActionAdmin> findByCible_IdOrderByDateActionDesc(UUID cibleId);

    @EntityGraph(attributePaths = {"admin", "cible"})
    List<ActionAdmin> findTop5ByOrderByDateActionDesc();

    @EntityGraph(attributePaths = {"admin", "cible"})
    Page<ActionAdmin> findByTypeIn(Collection<TypeActionAdmin> types, Pageable pageable);

    /** Dernière action de chaque compte de la page parmi les types donnés (motif d'une suspension). */
    @Query("""
        select a from ActionAdmin a
        where a.cible.id in :cibles and a.type in :types
          and a.dateAction = (select max(b.dateAction) from ActionAdmin b
                              where b.cible = a.cible and b.type in :types)
        """)
    List<ActionAdmin> dernieresActions(@Param("cibles") Collection<UUID> cibles,
                                       @Param("types") Collection<TypeActionAdmin> types);

    @Query("""
        select a.cible.id as cibleId, count(a) as nombre
        from ActionAdmin a
        where a.cible.id in :cibles
        group by a.cible.id
        """)
    List<NombreParCibleProjection> compterParCibles(@Param("cibles") Collection<UUID> cibles);

    interface NombreParCibleProjection {
        UUID getCibleId();
        Long getNombre();
    }
}
