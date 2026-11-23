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

    long countByOffre_IdAndStatut(UUID offreId, StatutCandidatureMobilite statut);

    long countByOffre_IdAndStatutIn(UUID offreId, Collection<StatutCandidatureMobilite> statuts);

    @Query("select c.offre.id from CandidatureMobilite c where c.id = :id")
    Optional<UUID> offreDe(@Param("id") UUID id);

    /** Liste d'attente d'une offre, par rang. */
    List<CandidatureMobilite> findByOffre_IdAndStatutOrderByRangAttenteAsc(UUID offreId, StatutCandidatureMobilite statut);

    /** Dossiers d'une offre, hors candidatures retirées, du plus ancien au plus récent. */
    @EntityGraph(attributePaths = {"candidat", "candidat.filiere"})
    List<CandidatureMobilite> findByOffre_IdAndStatutNotOrderBySoumiseLeAsc(UUID offreId, StatutCandidatureMobilite statut);

    @EntityGraph(attributePaths = {"candidat", "candidat.filiere"})
    List<CandidatureMobilite> findByOffre_IdAndStatutOrderByCandidat_NomAsc(UUID offreId, StatutCandidatureMobilite statut);

    /** Candidatures retenues de ces candidats sur d'autres offres de la même année universitaire : pour l'avertissement de doublon. */
    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    @Query("""
        select c from CandidatureMobilite c
        where c.candidat.id in :candidats and c.offre.id <> :offreId and c.offre.anneeUniversitaire = :annee
          and c.statut = ept.edu.sn.alumni_backend.mobilite.StatutCandidatureMobilite.RETENUE
        """)
    List<CandidatureMobilite> retenuesAilleurs(@Param("candidats") Collection<UUID> candidats, @Param("offreId") UUID offreId,
            @Param("annee") String annee);

    @Query("select c.candidat.id from CandidatureMobilite c where c.offre.id = :offreId and c.statut in :statuts")
    List<UUID> candidatsAuStatut(@Param("offreId") UUID offreId, @Param("statuts") Collection<StatutCandidatureMobilite> statuts);
}
