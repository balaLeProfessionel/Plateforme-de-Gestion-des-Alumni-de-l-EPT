package ept.edu.sn.alumni_backend.mentorat.dto;

import jakarta.validation.constraints.Size;

public record ValidationEtapeRequest(@Size(max = 500) String commentaire) {
}
