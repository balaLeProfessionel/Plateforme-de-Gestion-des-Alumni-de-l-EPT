package ept.edu.sn.alumni_backend.mobilite.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.mobilite.entity.HistoriqueMobilite;

public interface HistoriqueMobiliteRepository extends JpaRepository<HistoriqueMobilite, UUID> {
    @EntityGraph(attributePaths = "auteur")
    List<HistoriqueMobilite> findByObjetIdOrderByDateActionAsc(UUID objetId);
}
