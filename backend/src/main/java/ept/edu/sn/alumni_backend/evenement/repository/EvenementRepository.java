package ept.edu.sn.alumni_backend.evenement.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.evenement.entity.Evenement;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, UUID>, JpaSpecificationExecutor<Evenement> {
    @Override
    @EntityGraph(attributePaths = {"organisateur", "organisateur.organisme"})
    org.springframework.data.domain.Page<Evenement> findAll(
            org.springframework.data.jpa.domain.Specification<Evenement> specification,
            org.springframework.data.domain.Pageable pageable);
}
