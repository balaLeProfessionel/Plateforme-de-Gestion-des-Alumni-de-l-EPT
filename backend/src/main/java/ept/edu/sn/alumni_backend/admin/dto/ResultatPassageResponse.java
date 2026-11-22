package ept.edu.sn.alumni_backend.admin.dto;

import java.util.List;

/** Étudiants passés dans la nouvelle classe, et ceux laissés de côté avec la raison. */
public record ResultatPassageResponse(int passes, List<ResultatDiplomationResponse.Ignore> ignores) {
}
