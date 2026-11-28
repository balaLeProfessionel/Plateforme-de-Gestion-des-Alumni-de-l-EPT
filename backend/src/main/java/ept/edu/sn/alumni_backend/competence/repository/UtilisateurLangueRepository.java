package ept.edu.sn.alumni_backend.competence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.competence.entity.UtilisateurLangue;

public interface UtilisateurLangueRepository extends JpaRepository<UtilisateurLangue, UtilisateurLangue.Id> {
    List<UtilisateurLangue> findByUtilisateurId(UUID utilisateurId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from UtilisateurLangue ul where ul.utilisateur.id = :utilisateurId")
    void supprimerPour(@Param("utilisateurId") UUID utilisateurId);
}
