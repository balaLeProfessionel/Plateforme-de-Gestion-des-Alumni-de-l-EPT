package ept.edu.sn.alumni_backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RenvoyerOtpRequest(
    @Email @NotBlank String email
) {}