package ept.edu.sn.alumni_backend.emploi.repository;

import ept.edu.sn.alumni_backend.emploi.entity.SignalementOffreEmploi;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignalementOffreEmploiRepository extends JpaRepository<SignalementOffreEmploi, UUID> {
    boolean existsByOffreIdAndAuteurId(UUID offreId, UUID auteurId);
}
