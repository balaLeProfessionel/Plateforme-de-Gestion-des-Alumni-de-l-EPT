package ept.edu.sn.alumni_backend.security;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.transaction.Transactional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    @Modifying
    @Transactional
    void deleteByUtilisateur(Utilisateur utilisateur);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.expiration < :maintenant")
    int supprimerExpires(LocalDateTime maintenant);
}
