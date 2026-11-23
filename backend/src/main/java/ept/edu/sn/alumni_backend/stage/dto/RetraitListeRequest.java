package ept.edu.sn.alumni_backend.stage.dto;

import ept.edu.sn.alumni_backend.stage.entity.Stage;
import jakarta.validation.constraints.Size;

/** Retrait d'une ligne : le motif est exigé seulement pour annuler un stage déjà confirmé. */
public record RetraitListeRequest(@Size(max = Stage.LONGUEUR_MOTIF) String motif) {
}
