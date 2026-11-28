package ept.edu.sn.alumni_backend.emploi.repository;

import ept.edu.sn.alumni_backend.emploi.StatutCandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.CandidatureEmploi;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CandidatureEmploiRepository extends JpaRepository<CandidatureEmploi, UUID> {
    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    Optional<CandidatureEmploi> findByOffreIdAndCandidatId(UUID offreId, UUID candidatId);

    @EntityGraph(attributePaths = {"offre", "offre.organisme", "candidat"})
    Optional<CandidatureEmploi> findWithOffreById(UUID id);

    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    List<CandidatureEmploi> findByCandidatIdOrderByEnvoyeeLeDesc(UUID candidatId);

    boolean existsByOffreId(UUID offreId);

    boolean existsByOffreIdAndCandidatId(UUID offreId, UUID candidatId);

    /** Candidatures que le recruteur voit : toutes sauf celles retirées par leur candidat. */
    @EntityGraph(attributePaths = {"candidat", "candidat.filiere"})
    List<CandidatureEmploi> findByOffreIdAndStatutNotOrderByEnvoyeeLeDesc(UUID offreId, StatutCandidatureEmploi statut);

    /** Par offre : [id de l'offre, candidatures hors celles retirées, candidatures encore « reçues »]. */
    @Query("""
        select c.offre.id, count(c), sum(case when c.statut = :aTraiter then 1 else 0 end)
        from CandidatureEmploi c where c.offre.id in :offres and c.statut <> :retiree group by c.offre.id
        """)
    List<Object[]> compterParOffre(@Param("offres") Collection<UUID> offres, @Param("aTraiter") StatutCandidatureEmploi aTraiter,
        @Param("retiree") StatutCandidatureEmploi retiree);

    List<CandidatureEmploi> findByOffreIdAndStatutIn(UUID offreId, Collection<StatutCandidatureEmploi> statuts);

    /** CV encore conservés alors que l'offre est clôturée ou expirée depuis la durée de conservation. */
    @Query("""
        select c from CandidatureEmploi c join c.offre o
        where c.cvSupprimeLe is null
          and ((o.clotureeLe is not null and o.clotureeLe < :clotureeAvant) or o.dateExpiration < :expireeAvant)
        """)
    List<CandidatureEmploi> cvAPurger(@Param("clotureeAvant") Instant clotureeAvant, @Param("expireeAvant") LocalDate expireeAvant);
}
