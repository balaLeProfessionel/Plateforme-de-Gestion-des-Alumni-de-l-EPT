package ept.edu.sn.alumni_backend.stage.dto;

import java.util.UUID;

/** Encadrant interne désigné ; null retire l'encadrant. */
public record EncadrantRequest(UUID encadrantId) {
}
