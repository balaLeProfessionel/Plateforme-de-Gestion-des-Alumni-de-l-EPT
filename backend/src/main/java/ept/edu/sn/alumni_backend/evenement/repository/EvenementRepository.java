package ept.edu.sn.alumni_backend.evenement.repository;

import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import java.util.UUID;
import java.time.Instant;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import ept.edu.sn.alumni_backend.evenement.entity.Evenement;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, UUID>, JpaSpecificationExecutor<Evenement> {
    long countByOrganisateur_IdAndCreeLeGreaterThanEqual(UUID organisateurId, Instant creeLe);

    long countByStatutAndDateDebutAfter(StatutEvenement statut, Instant apres);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select evenement from Evenement evenement where evenement.id = :id")
    java.util.Optional<Evenement> findByIdAvecVerrou(@Param("id") UUID id);

    @Override
    @EntityGraph(attributePaths = {"organisateur", "organisateur.organisme"})
    org.springframework.data.domain.Page<Evenement> findAll(
            org.springframework.data.jpa.domain.Specification<Evenement> specification,
            org.springframework.data.domain.Pageable pageable);
}
