package ept.edu.sn.alumni_backend.emploi.repository;

import ept.edu.sn.alumni_backend.emploi.entity.CandidatureEmploi;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidatureEmploiRepository extends JpaRepository<CandidatureEmploi, UUID> {
    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    Optional<CandidatureEmploi> findByOffreIdAndCandidatId(UUID offreId, UUID candidatId);

    @EntityGraph(attributePaths = {"offre", "offre.organisme", "candidat"})
    Optional<CandidatureEmploi> findWithOffreById(UUID id);

    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    List<CandidatureEmploi> findByCandidatIdOrderByEnvoyeeLeDesc(UUID candidatId);

    boolean existsByOffreId(UUID offreId);
}
