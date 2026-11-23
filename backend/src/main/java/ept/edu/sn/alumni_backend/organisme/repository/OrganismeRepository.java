package ept.edu.sn.alumni_backend.organisme.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import jakarta.persistence.LockModeType;

@Repository
public interface OrganismeRepository extends JpaRepository<Organisme, UUID>, JpaSpecificationExecutor<Organisme> {
    List<Organisme> findByNomContainingIgnoreCase(String nom);

    Optional<Organisme> findByNomIgnoreCase(String nom);

    Optional<Organisme> findFirstByEtablissementEptTrue();

    /** Verrouille l'organisme : deux demandes simultanées ne passent pas toutes les deux. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Organisme o where o.id = :id")
    Optional<Organisme> findByIdForUpdate(@Param("id") UUID id);
}
