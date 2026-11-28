package ept.edu.sn.alumni_backend.mobilite.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.mobilite.entity.PieceCandidatureMobilite;

public interface PieceCandidatureMobiliteRepository extends JpaRepository<PieceCandidatureMobilite, UUID> {
    Optional<PieceCandidatureMobilite> findByIdAndCandidature_Id(UUID id, UUID candidatureId);
}
