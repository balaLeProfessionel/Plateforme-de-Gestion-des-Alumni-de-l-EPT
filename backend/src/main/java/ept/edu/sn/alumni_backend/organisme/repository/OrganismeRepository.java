package ept.edu.sn.alumni_backend.organisme.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.organisme.entity.Organisme;

@Repository
public interface OrganismeRepository extends JpaRepository<Organisme, UUID> {

}
