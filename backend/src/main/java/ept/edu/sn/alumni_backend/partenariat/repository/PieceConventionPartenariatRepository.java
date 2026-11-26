package ept.edu.sn.alumni_backend.partenariat.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.partenariat.entity.PieceConventionPartenariat;

public interface PieceConventionPartenariatRepository extends JpaRepository<PieceConventionPartenariat, UUID> {
    long countByConvention_Id(UUID conventionId);

    Optional<PieceConventionPartenariat> findByIdAndConvention_Id(UUID id, UUID conventionId);
}
