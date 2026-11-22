package ept.edu.sn.alumni_backend.mobilite.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.mobilite.entity.PieceJointeOffreMobilite;

public interface PieceJointeOffreMobiliteRepository extends JpaRepository<PieceJointeOffreMobilite, UUID> {
    long countByOffre_Id(UUID offreId);

    Optional<PieceJointeOffreMobilite> findByIdAndOffre_Id(UUID id, UUID offreId);
}
