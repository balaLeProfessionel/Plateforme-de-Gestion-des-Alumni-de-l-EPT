package ept.edu.sn.alumni_backend.filiere.service;

import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.filiere.dto.FiliereAdminResponse;
import ept.edu.sn.alumni_backend.filiere.dto.FiliereResponse;
import ept.edu.sn.alumni_backend.filiere.entity.ChefDepartement;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.exception.ConflitFiliereException;
import ept.edu.sn.alumni_backend.filiere.exception.FiliereIntrouvableException;
import ept.edu.sn.alumni_backend.filiere.repository.ChefDepartementRepository;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Filières de l'école (TRA-14). L'administration (responsabilité Comptes) les ajoute, les renomme, les retire et
 * fusionne les doublons. Une filière n'est créée à la volée que par un administrateur qui crée un compte (« Autre… ») ;
 * l'inscription publique et l'import n'acceptent qu'une filière existante et active.
 */
@Service
@RequiredArgsConstructor
public class FiliereService {
    /** Ordre alphabétique français : « Génie Électromécanique » avant « Génie Industriel ». */
    private static final Comparator<Filiere> PAR_NOM =
        Comparator.comparing(Filiere::getNom, Collator.getInstance(Locale.FRENCH));

    private final FiliereRepository filiereRepository;
    private final ChefDepartementRepository chefDepartementRepository;

    @Transactional(readOnly = true)
    public List<FiliereResponse> listerActives() {
        return filiereRepository.findByActiveTrue().stream().sorted(PAR_NOM)
            .map(filiere -> new FiliereResponse(filiere.getId(), filiere.getNom())).toList();
    }

    @Transactional(readOnly = true)
    public List<FiliereAdminResponse> listerPourAdministration() {
        Map<UUID, Long> comptes = filiereRepository.compterComptes().stream()
            .collect(Collectors.toMap(FiliereRepository.NombreComptesProjection::getFiliereId,
                FiliereRepository.NombreComptesProjection::getNombre));
        Map<UUID, ChefDepartement> chefs = chefDepartementRepository.findAll().stream()
            .collect(Collectors.toMap(ChefDepartement::getFiliereId, Function.identity()));
        return filiereRepository.findAll().stream().sorted(PAR_NOM)
            .map(filiere -> versReponse(filiere, comptes.getOrDefault(filiere.getId(), 0L), chefs.get(filiere.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public FiliereAdminResponse ligne(UUID id) {
        return listerPourAdministration().stream().filter(ligne -> ligne.id().equals(id)).findFirst()
            .orElseThrow(FiliereIntrouvableException::new);
    }

    @Transactional
    public FiliereAdminResponse creer(String nom, UtilisateurPrincipal principal) {
        verifierNom(nom);
        filiereRepository.findByCle(Filiere.cle(nom)).ifPresent(existante -> {
            throw new ConflitFiliereException("La filière « " + existante.getNom() + " » existe déjà.");
        });
        Filiere filiere = filiereRepository.save(new Filiere(nom, principal.getUtilisateur()));
        return ligne(filiere.getId());
    }

    @Transactional
    public FiliereAdminResponse renommer(UUID id, String nom) {
        verifierNom(nom);
        Filiere filiere = filiereRepository.findByIdForUpdate(id).orElseThrow(FiliereIntrouvableException::new);
        filiereRepository.findByCle(Filiere.cle(nom)).filter(autre -> !autre.getId().equals(id)).ifPresent(autre -> {
            throw new ConflitFiliereException(
                "La filière « " + autre.getNom() + " » existe déjà : fusionnez les deux filières plutôt que de les renommer.");
        });
        if (Filiere.nettoyer(nom).equals(filiere.getNom())) {
            throw new ConflitFiliereException("La filière porte déjà ce nom.");
        }
        filiere.renommer(nom);
        return ligne(id);
    }

    @Transactional
    public FiliereAdminResponse changerActivite(UUID id, boolean active) {
        Filiere filiere = filiereRepository.findByIdForUpdate(id).orElseThrow(FiliereIntrouvableException::new);
        if (filiere.isActive() == active) {
            throw new ConflitFiliereException(active ? "Cette filière est déjà proposée." : "Cette filière est déjà retirée.");
        }
        filiere.setActive(active);
        return ligne(id);
    }

    /**
     * La filière source disparaît et ses comptes passent dans la cible. Son chef de département passe aussi à la
     * cible si celle-ci n'en a pas ; sinon c'est celui de la cible qui reste.
     */
    @Transactional
    public FiliereAdminResponse fusionner(UUID sourceId, UUID cibleId) {
        if (sourceId.equals(cibleId)) {
            throw new IllegalArgumentException("Choisissez une autre filière que celle à fusionner.");
        }
        // Toujours le même ordre de verrouillage, pour que deux fusions croisées ne s'interbloquent pas.
        boolean sourceDabord = sourceId.compareTo(cibleId) < 0;
        Filiere premiere = filiereRepository.findByIdForUpdate(sourceDabord ? sourceId : cibleId).orElseThrow(FiliereIntrouvableException::new);
        Filiere seconde = filiereRepository.findByIdForUpdate(sourceDabord ? cibleId : sourceId).orElseThrow(FiliereIntrouvableException::new);
        Filiere source = sourceDabord ? premiere : seconde;
        Filiere cible = sourceDabord ? seconde : premiere;

        Optional<ChefDepartement> chefSource = chefDepartementRepository.findById(sourceId);
        boolean cibleAUnChef = chefDepartementRepository.existsById(cibleId);
        chefSource.ifPresent(chef -> {
            chefDepartementRepository.delete(chef);
            chefDepartementRepository.flush();
            if (!cibleAUnChef) {
                chefDepartementRepository.save(new ChefDepartement(cible, chef.getChef(), chef.getDesignePar()));
            }
        });
        filiereRepository.deplacerComptes(source, cible);
        filiereRepository.deleteById(sourceId);
        return ligne(cibleId);
    }

    /** Filière d'un compte créé par l'administration : l'existante si le nom est connu, sinon une nouvelle. */
    @Transactional
    public Filiere trouverOuCreer(String nom, Utilisateur auteur) {
        if (nom == null || nom.isBlank()) {
            return null;
        }
        verifierNom(nom);
        Optional<Filiere> existante = filiereRepository.findByCle(Filiere.cle(nom));
        if (existante.isPresent()) {
            return exigerActive(existante.get());
        }
        return filiereRepository.save(new Filiere(nom, auteur));
    }

    /** Filière choisie à l'inscription ou dans un import : elle doit exister et être proposée. */
    @Transactional(readOnly = true)
    public Filiere exigerExistante(String nom) {
        if (nom == null || nom.isBlank()) {
            return null;
        }
        Filiere filiere = filiereRepository.findByCle(Filiere.cle(nom)).orElseThrow(() -> new IllegalArgumentException(
            "La filière « " + Filiere.nettoyer(nom) + " » n'existe pas. Ajoutez-la depuis l'écran Filières, ou corrigez le nom."));
        return exigerActive(filiere);
    }

    private static Filiere exigerActive(Filiere filiere) {
        if (!filiere.isActive()) {
            throw new IllegalArgumentException(
                "La filière « " + filiere.getNom() + " » est retirée. Proposez-la de nouveau depuis l'écran Filières pour l'utiliser.");
        }
        return filiere;
    }

    private static void verifierNom(String nom) {
        String propre = Filiere.nettoyer(nom);
        if (propre.isEmpty()) {
            throw new IllegalArgumentException("Le nom de la filière est obligatoire.");
        }
        if (propre.length() > Filiere.LONGUEUR_NOM) {
            throw new IllegalArgumentException("Le nom de la filière ne doit pas dépasser 120 caractères.");
        }
    }

    private static FiliereAdminResponse versReponse(Filiere filiere, long nombreComptes, ChefDepartement chef) {
        FiliereAdminResponse.Chef resume = chef == null ? null : new FiliereAdminResponse.Chef(
            chef.getChef().getId(), chef.getChef().getPrenom(), chef.getChef().getNom(), chef.getDesigneLe());
        return new FiliereAdminResponse(filiere.getId(), filiere.getNom(), filiere.isActive(), nombreComptes, resume);
    }
}
