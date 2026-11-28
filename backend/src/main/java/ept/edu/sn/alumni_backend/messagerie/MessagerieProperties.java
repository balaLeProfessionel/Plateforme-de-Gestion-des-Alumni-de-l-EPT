package ept.edu.sn.alumni_backend.messagerie;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Min;

/** Nombre de messages qu'une personne peut envoyer par minute, toutes conversations confondues. */
@Validated
@ConfigurationProperties(prefix = "app.messagerie")
public record MessagerieProperties(@DefaultValue("30") @Min(1) int limiteEnvoisParMinute) {}
