package ept.edu.sn.alumni_backend.apercu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApercuLienRequest(@NotBlank @Size(max = 500) String url) {}
