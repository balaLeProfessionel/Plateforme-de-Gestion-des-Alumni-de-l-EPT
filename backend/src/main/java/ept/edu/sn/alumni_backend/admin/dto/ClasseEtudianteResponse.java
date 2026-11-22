package ept.edu.sn.alumni_backend.admin.dto;

/** Étudiants d'une classe et d'une filière ; classe ou filière null : non renseignée. */
public record ClasseEtudianteResponse(String classe, String filiere, long nombre) {
}
