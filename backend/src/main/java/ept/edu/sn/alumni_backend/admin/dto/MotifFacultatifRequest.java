package ept.edu.sn.alumni_backend.admin.dto;

import jakarta.validation.constraints.Size;

public record MotifFacultatifRequest(@Size(max = 500) String motif) {
}
