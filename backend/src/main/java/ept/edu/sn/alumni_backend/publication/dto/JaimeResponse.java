package ept.edu.sn.alumni_backend.publication.dto;

/** Nombre de « J'aime » d'une publication et si le lecteur en fait partie. */
public record JaimeResponse(long nombre, boolean jaime) {}
