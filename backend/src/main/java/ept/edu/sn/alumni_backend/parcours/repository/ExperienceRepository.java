package ept.edu.sn.alumni_backend.parcours.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Repository
public interface ExperienceRepository extends JpaRepository<ExperienceProfessionelle, UUID> {
    List<ExperienceProfessionelle> findByUtilisateurOrderByDateDebutDesc(Utilisateur utilisateur);
}
