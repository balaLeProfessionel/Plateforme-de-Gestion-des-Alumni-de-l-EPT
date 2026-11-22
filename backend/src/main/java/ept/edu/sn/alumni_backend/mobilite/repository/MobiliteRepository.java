package ept.edu.sn.alumni_backend.mobilite.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.mobilite.entity.Mobilite;

public interface MobiliteRepository extends JpaRepository<Mobilite, UUID> {
    Optional<Mobilite> findByCandidature_Id(UUID candidatureId);
}
