package ept.edu.sn.alumni_backend.parcours.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Repository
public interface FormationRepository extends JpaRepository<Formation, UUID> {
    List<Formation> findByUtilisateurOrderByDateDebutDesc(Utilisateur utilisateur);
}
