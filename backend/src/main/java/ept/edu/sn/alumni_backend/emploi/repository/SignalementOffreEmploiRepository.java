package ept.edu.sn.alumni_backend.emploi.repository;

import ept.edu.sn.alumni_backend.emploi.StatutOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.SignalementOffreEmploi;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SignalementOffreEmploiRepository extends JpaRepository<SignalementOffreEmploi, UUID> {
    boolean existsByOffreIdAndAuteurId(UUID offreId, UUID auteurId);

    /** Signalements en attente des offres données, les plus anciens d'abord (#224). */
    @EntityGraph(attributePaths = "auteur")
    List<SignalementOffreEmploi> findByOffreIdInAndTraiteLeIsNullOrderByCreeLeAsc(Collection<UUID> offreIds);

    List<SignalementOffreEmploi> findByOffreIdAndTraiteLeIsNull(UUID offreId);

    /** Offres d'un statut donné visées par au moins un signalement en attente. */
    @Query("select count(distinct s.offre.id) from SignalementOffreEmploi s where s.traiteLe is null and s.offre.statut = :statut")
    long compterOffresSignalees(@Param("statut") StatutOffreEmploi statut);
}
