package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.Map;

import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;

/** Nombre de communautés en tout et par catégorie (une catégorie sans communauté vaut 0). */
public record ResumeCommunautesResponse(long total, Map<CategorieCommunaute, Long> parCategorie) {}
