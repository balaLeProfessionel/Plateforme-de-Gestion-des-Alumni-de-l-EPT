package ept.edu.sn.alumni_backend.utilisateur;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.enums.StatutCompte;

import java.util.List;
import java.util.Optional;


@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID>,
        JpaSpecificationExecutor<Utilisateur> {
    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Utilisateur> findByStatutCompte(StatutCompte statutCompte);
}
