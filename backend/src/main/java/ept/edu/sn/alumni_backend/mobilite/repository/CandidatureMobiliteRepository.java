package ept.edu.sn.alumni_backend.mobilite.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.mobilite.StatutCandidatureMobilite;
import ept.edu.sn.alumni_backend.mobilite.entity.CandidatureMobilite;

public interface CandidatureMobiliteRepository extends JpaRepository<CandidatureMobilite, UUID> {
    Optional<CandidatureMobilite> findByOffre_IdAndCandidat_Id(UUID offreId, UUID candidatId);

    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    List<CandidatureMobilite> findByCandidat_IdOrderBySoumiseLeDesc(UUID candidatId);

    @EntityGraph(attributePaths = {"offre", "offre.organisme", "candidat"})
    Optional<CandidatureMobilite> findWithOffreById(UUID id);

    long countByOffre_IdAndStatutNot(UUID offreId, StatutCandidatureMobilite statut);

    @Query("select c.candidat.id from CandidatureMobilite c where c.offre.id = :offreId and c.statut in :statuts")
    List<UUID> candidatsAuStatut(@Param("offreId") UUID offreId, @Param("statuts") Collection<StatutCandidatureMobilite> statuts);
}
