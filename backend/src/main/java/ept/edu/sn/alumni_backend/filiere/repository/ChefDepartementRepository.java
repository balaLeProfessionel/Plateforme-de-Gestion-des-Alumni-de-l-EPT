package ept.edu.sn.alumni_backend.filiere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.filiere.entity.ChefDepartement;

public interface ChefDepartementRepository extends JpaRepository<ChefDepartement, UUID> {
    @Override
    @EntityGraph(attributePaths = "chef")
    List<ChefDepartement> findAll();
}
