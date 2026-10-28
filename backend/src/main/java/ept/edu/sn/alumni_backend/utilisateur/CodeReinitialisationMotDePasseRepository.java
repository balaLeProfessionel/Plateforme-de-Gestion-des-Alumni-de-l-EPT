package ept.edu.sn.alumni_backend.utilisateur;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.transaction.Transactional;

public interface CodeReinitialisationMotDePasseRepository
        extends JpaRepository<CodeReinitialisationMotDePasse, UUID> {

    Optional<CodeReinitialisationMotDePasse> findByUtilisateur(Utilisateur utilisateur);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM CodeReinitialisationMotDePasse c WHERE c.utilisateur = :utilisateur")
    void deleteByUtilisateur(@Param("utilisateur") Utilisateur utilisateur);

    @Modifying
    @Transactional
    @Query("DELETE FROM CodeReinitialisationMotDePasse c WHERE c.expiration < :maintenant")
    int supprimerExpires(LocalDateTime maintenant);
}
