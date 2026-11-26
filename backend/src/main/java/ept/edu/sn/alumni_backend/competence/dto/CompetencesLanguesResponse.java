package ept.edu.sn.alumni_backend.competence.dto;

import java.util.List;

public record CompetencesLanguesResponse(List<String> competences, List<LangueResponse> langues) {}
