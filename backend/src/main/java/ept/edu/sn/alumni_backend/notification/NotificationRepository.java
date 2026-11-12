package ept.edu.sn.alumni_backend.notification;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByDestinataire_IdOrderByCreeLeDescIdDesc(UUID destinataireId, Pageable pageable);

    Page<Notification> findByDestinataire_IdAndLueFalseOrderByCreeLeDescIdDesc(UUID destinataireId, Pageable pageable);

    long countByDestinataire_IdAndLueFalse(UUID destinataireId);

    @Modifying
    @Query("update Notification n set n.lue = true where n.id = :id and n.destinataire.id = :destinataireId")
    int marquerLue(@Param("id") UUID id, @Param("destinataireId") UUID destinataireId);

    @Modifying
    @Query("update Notification n set n.lue = true where n.destinataire.id = :destinataireId and n.lue = false")
    int toutMarquerLu(@Param("destinataireId") UUID destinataireId);

    @Modifying
    @Query("delete from Notification n where n.creeLe < :limite")
    int supprimerAnterieuresA(@Param("limite") Instant limite);
}
