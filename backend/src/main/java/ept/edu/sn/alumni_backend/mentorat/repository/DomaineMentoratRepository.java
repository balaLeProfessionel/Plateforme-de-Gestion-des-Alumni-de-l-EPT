package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.mentorat.entity.DomaineMentorat;

@Repository
public interface DomaineMentoratRepository extends JpaRepository<DomaineMentorat, UUID> {
    List<DomaineMentorat> findByActifTrueOrderByOrdreAscLibelleAsc();

    boolean existsByCode(String code);
}
