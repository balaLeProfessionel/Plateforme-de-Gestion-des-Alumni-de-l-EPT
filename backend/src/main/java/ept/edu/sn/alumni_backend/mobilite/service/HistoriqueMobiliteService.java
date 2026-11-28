package ept.edu.sn.alumni_backend.mobilite.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.mobilite.ActionHistorique;
import ept.edu.sn.alumni_backend.mobilite.ObjetHistorique;
import ept.edu.sn.alumni_backend.mobilite.entity.HistoriqueMobilite;
import ept.edu.sn.alumni_backend.mobilite.repository.HistoriqueMobiliteRepository;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Consigne chaque opération des mobilités, dans la transaction de l'opération : rien n'est écrit pour une opération annulée. */
@Service
@RequiredArgsConstructor
public class HistoriqueMobiliteService {
    private final HistoriqueMobiliteRepository historiqueRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void consigner(ObjetHistorique objet, UUID objetId, ActionHistorique action, String details, String motif, UUID auteurId) {
        historiqueRepository.save(new HistoriqueMobilite(objet, objetId, action, details, motif, utilisateurRepository.getReferenceById(auteurId)));
    }
}
