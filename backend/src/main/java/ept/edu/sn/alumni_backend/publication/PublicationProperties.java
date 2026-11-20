package ept.edu.sn.alumni_backend.publication;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Min;

@Validated
@ConfigurationProperties(prefix = "app.publications")
public record PublicationProperties(@DefaultValue("10") @Min(1) int limiteCreations24h) {}
