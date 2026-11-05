package ept.edu.sn.alumni_backend.temoignage.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.temoignage.entity.Temoignage;

@Repository
public interface TemoignageRepository extends JpaRepository<Temoignage, UUID> {
    List<Temoignage> findTop10ByPublieTrueOrderByOrdreAscCreeLeDesc();
}
