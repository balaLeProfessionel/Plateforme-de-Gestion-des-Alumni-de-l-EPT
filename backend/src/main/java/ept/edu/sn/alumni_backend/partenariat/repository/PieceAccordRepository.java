package ept.edu.sn.alumni_backend.partenariat.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.partenariat.entity.PieceAccord;

public interface PieceAccordRepository extends JpaRepository<PieceAccord, UUID> {
    long countByAccord_Id(UUID accordId);

    Optional<PieceAccord> findByIdAndAccord_Id(UUID id, UUID accordId);
}
