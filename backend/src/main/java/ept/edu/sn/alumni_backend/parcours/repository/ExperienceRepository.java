package ept.edu.sn.alumni_backend.parcours.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Repository
public interface ExperienceRepository extends JpaRepository<ExperienceProfessionelle, UUID> {
    List<ExperienceProfessionelle> findByUtilisateurOrderByDateDebutDesc(Utilisateur utilisateur);

    /** Organismes du parcours de plusieurs membres à la fois, en une requête. */
    @Query("""
        select e.utilisateur.id as utilisateurId, o.id as organismeId, o.secteurActivite as secteur
        from ExperienceProfessionelle e join e.organisme o where e.utilisateur.id in :membres""")
    List<OrganismeDuMembre> organismesDe(@Param("membres") Collection<UUID> membres);
}
