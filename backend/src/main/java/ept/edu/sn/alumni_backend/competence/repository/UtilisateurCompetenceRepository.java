package ept.edu.sn.alumni_backend.competence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.competence.entity.UtilisateurCompetence;

public interface UtilisateurCompetenceRepository
        extends JpaRepository<UtilisateurCompetence, UtilisateurCompetence.Id> {

    @EntityGraph(attributePaths = "competence")
    List<UtilisateurCompetence> findByUtilisateurIdOrderByOrdreAsc(UUID utilisateurId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from UtilisateurCompetence uc where uc.utilisateur.id = :utilisateurId")
    void supprimerPour(@Param("utilisateurId") UUID utilisateurId);
}
