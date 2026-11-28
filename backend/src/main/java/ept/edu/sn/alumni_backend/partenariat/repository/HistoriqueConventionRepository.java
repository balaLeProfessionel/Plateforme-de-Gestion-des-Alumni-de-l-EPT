package ept.edu.sn.alumni_backend.partenariat.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.partenariat.entity.HistoriqueConvention;

public interface HistoriqueConventionRepository extends JpaRepository<HistoriqueConvention, UUID> {
    @EntityGraph(attributePaths = "auteur")
    List<HistoriqueConvention> findByConventionIdOrderByDateActionAsc(UUID conventionId);
}
