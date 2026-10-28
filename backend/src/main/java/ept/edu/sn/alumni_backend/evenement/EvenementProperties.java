package ept.edu.sn.alumni_backend.evenement;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;

@Validated
@ConfigurationProperties(prefix = "app.evenements")
public record EvenementProperties(@Min(1) int limiteCreations24h) {
}
