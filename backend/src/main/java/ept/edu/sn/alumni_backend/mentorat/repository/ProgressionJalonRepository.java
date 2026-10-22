package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.mentorat.entity.ProgressionJalon;

public interface ProgressionJalonRepository extends JpaRepository<ProgressionJalon, UUID> {
}
