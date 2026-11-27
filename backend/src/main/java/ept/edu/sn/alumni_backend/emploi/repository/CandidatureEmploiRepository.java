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

    /** Candidatures que le recruteur voit : toutes sauf celles retirées par leur candidat. */
    @EntityGraph(attributePaths = {"candidat", "candidat.filiere"})
    List<CandidatureEmploi> findByOffreIdAndStatutNotOrderByEnvoyeeLeDesc(UUID offreId, StatutCandidatureEmploi statut);

    List<CandidatureEmploi> findByOffreIdAndStatutIn(UUID offreId, Collection<StatutCandidatureEmploi> statuts);

    /** CV encore conservés alors que l'offre est clôturée ou expirée depuis la durée de conservation. */
    @Query("""
        select c from CandidatureEmploi c join c.offre o
        where c.cvSupprimeLe is null
          and ((o.clotureeLe is not null and o.clotureeLe < :clotureeAvant) or o.dateExpiration < :expireeAvant)
        """)
    List<CandidatureEmploi> cvAPurger(@Param("clotureeAvant") Instant clotureeAvant, @Param("expireeAvant") LocalDate expireeAvant);
}
