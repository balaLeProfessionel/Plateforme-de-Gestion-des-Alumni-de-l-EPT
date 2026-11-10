package ept.edu.sn.alumni_backend.stage.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.stage.entity.PieceJointeOffre;

public interface PieceJointeOffreRepository extends JpaRepository<PieceJointeOffre, UUID> {
    Optional<PieceJointeOffre> findByIdAndOffre_Id(UUID id, UUID offreId);

    long countByOffre_Id(UUID offreId);
}
