package ept.edu.sn.alumni_backend.admin.dto;

/** Une promotion d'entrée d'étudiants encore inscrits comme tels, par filière. */
public record PromotionResponse(Integer anneeEntree, String filiere, long nombre) {
}
