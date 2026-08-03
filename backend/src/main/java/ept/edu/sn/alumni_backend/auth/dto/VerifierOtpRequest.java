package ept.edu.sn.alumni_backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifierOtpRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(min = 6, max = 6, message = "Le code doit contenir 6 chiffres") String code
) {}