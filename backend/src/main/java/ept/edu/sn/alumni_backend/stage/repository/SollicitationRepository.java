package ept.edu.sn.alumni_backend.stage.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.stage.entity.Sollicitation;

public interface SollicitationRepository extends JpaRepository<Sollicitation, UUID> {
    @EntityGraph(attributePaths = "envoyeePar")
    Page<Sollicitation> findAllByOrderByEnvoyeeLeDesc(Pageable pageable);
}
