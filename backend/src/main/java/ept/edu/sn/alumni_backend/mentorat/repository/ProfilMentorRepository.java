package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.mentorat.entity.ProfilMentor;
import jakarta.persistence.LockModeType;

@Repository
public interface ProfilMentorRepository
        extends JpaRepository<ProfilMentor, UUID>, JpaSpecificationExecutor<ProfilMentor> {
    Optional<ProfilMentor> findByUtilisateur_Id(UUID utilisateurId);

    @Override
    @EntityGraph(attributePaths = "utilisateur")
    Page<ProfilMentor> findAll(Specification<ProfilMentor> specification, Pageable pageable);

    /**
     * Verrouille le profil pendant une demande ou une acceptation : les places restantes et
     * l'unicité d'une demande en cours sont vérifiées sans risque de double comptage.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select profil from ProfilMentor profil where profil.id = :id")
    Optional<ProfilMentor> findByIdForUpdate(@Param("id") UUID id);
}
