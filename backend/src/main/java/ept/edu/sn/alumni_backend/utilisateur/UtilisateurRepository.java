package ept.edu.sn.alumni_backend.utilisateur;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import ept.edu.sn.alumni_backend.enums.StatutCompte;

import java.util.List;
import java.util.Optional;


@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID>,
        JpaSpecificationExecutor<Utilisateur> {
    Optional<Utilisateur> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Utilisateur u where u.id = :id")
    Optional<Utilisateur> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByEmail(String email);

    List<Utilisateur> findByStatutCompte(StatutCompte statutCompte);
}
