package ept.edu.sn.alumni_backend.competence.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.competence.entity.Competence;

public interface CompetenceRepository extends JpaRepository<Competence, UUID> {
    List<Competence> findByCleIn(Collection<String> cles);

    List<Competence> findByCleContainingOrderByLibelleAsc(String fragment, Limit limite);
}
