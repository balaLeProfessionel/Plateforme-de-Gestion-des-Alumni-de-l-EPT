package ept.edu.sn.alumni_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Jeton d'identité (« credential ») renvoyé par le bouton Google. */
public record ConnexionGoogleRequest(@NotBlank @Size(max = 4096) String credential) {}
