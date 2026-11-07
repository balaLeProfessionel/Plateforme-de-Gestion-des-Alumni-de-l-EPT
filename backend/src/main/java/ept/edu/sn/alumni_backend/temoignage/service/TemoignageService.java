package ept.edu.sn.alumni_backend.temoignage.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.temoignage.dto.TemoignagePublicResponse;
import ept.edu.sn.alumni_backend.temoignage.repository.TemoignageRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TemoignageService {
    private final TemoignageRepository temoignageRepository;

    @Transactional(readOnly = true)
    public List<TemoignagePublicResponse> listerPublies() {
        return temoignageRepository.findTop10ByPublieTrueOrderByOrdreAscCreeLeDesc().stream()
            .map(temoignage -> new TemoignagePublicResponse(
                temoignage.getNom(), temoignage.getPromotion(), temoignage.getFonction(), temoignage.getOrganisation(),
                temoignage.getPays(), temoignage.getTexte(), temoignage.getUrlPhoto()))
            .toList();
    }
}
