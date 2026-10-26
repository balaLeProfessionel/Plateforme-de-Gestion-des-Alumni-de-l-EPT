package ept.edu.sn.alumni_backend.admin.service;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import java.util.Collection;
import java.util.EnumSet;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.dto.EntreeJournalResponse;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/** Journal de toutes les décisions de l'administration, du plus récent au plus ancien. */
@Service
@RequiredArgsConstructor
public class JournalAdminService {
    private final ActionAdminRepository actionAdminRepository;

    @Transactional(readOnly = true)
    public PageResponse<EntreeJournalResponse> lister(Collection<TypeActionAdmin> types, int page, int taille) {
        Collection<TypeActionAdmin> filtre = types == null || types.isEmpty() ? EnumSet.allOf(TypeActionAdmin.class) : types;
        return PageResponse.depuis(actionAdminRepository
            .findByTypeIn(filtre, PageRequest.of(page, taille, Sort.by("dateAction").descending().and(Sort.by("id"))))
            .map(this::versEntree));
    }

    EntreeJournalResponse versEntree(ActionAdmin action) {
        Utilisateur cible = action.getCible();
        return new EntreeJournalResponse(action.getId(), action.getType().name(), action.getMotif(), action.getDetails(), action.getDateAction(),
            NomCompte.complet(action.getAdmin()), cible.getId(), NomCompte.complet(cible), cible.getRole().name());
    }

}
