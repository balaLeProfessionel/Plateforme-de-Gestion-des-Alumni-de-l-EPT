package ept.edu.sn.alumni_backend.parcours.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;

@Repository
public interface ExperienceProfessionelleRepository extends JpaRepository<ExperienceProfessionelle, UUID> {

}
