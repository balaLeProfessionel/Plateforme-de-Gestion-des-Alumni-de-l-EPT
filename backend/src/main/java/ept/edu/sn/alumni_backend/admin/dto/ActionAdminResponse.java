package ept.edu.sn.alumni_backend.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record ActionAdminResponse(UUID id, String type, String motif, String details, Instant dateAction, String auteur) {
}
