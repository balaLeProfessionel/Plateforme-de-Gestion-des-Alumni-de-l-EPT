package ept.edu.sn.alumni_backend.messagerie.controller;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.AjoutParticipantsRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationDetailResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.GroupeRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.MembreBloqueResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.MessageRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.MessageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ModificationGroupeRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.NombreNonLusResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.OuvertureDirecteRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.PageMessagesResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.RoleParticipantRequest;
import ept.edu.sn.alumni_backend.messagerie.service.BlocageService;
import ept.edu.sn.alumni_backend.messagerie.service.ConversationService;
import ept.edu.sn.alumni_backend.messagerie.service.MessageService;
import ept.edu.sn.alumni_backend.messagerie.tempsreel.DiffuseurMessagerie;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Messagerie interne : conversations directes et groupes. Seuls les participants y ont accès. */
@RestController
@RequestMapping("/api/messagerie")
@RequiredArgsConstructor
@Validated
public class MessagerieController {
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final BlocageService blocageService;
    private final DiffuseurMessagerie diffuseur;

    /** Flux temps réel (Server-Sent Events) : de courts signaux « telle conversation a changé ». */
    @GetMapping(value = "/flux", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter flux(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return diffuseur.ouvrir(moi(principal));
    }

    @GetMapping("/conversations")
    public PageResponse<ConversationResponse> lister(@RequestParam(defaultValue = "0") @Min(0) int page,
                                                     @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille,
                                                     @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.lister(moi(principal), page, taille);
    }

    /** 201 à la création, 200 quand la conversation existait déjà. */
    @PostMapping("/conversations/directes")
    public ResponseEntity<ConversationResponse> ouvrirDirecte(@Valid @RequestBody OuvertureDirecteRequest requete,
                                                              @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ConversationService.Ouverture ouverture = conversationService.ouvrirDirecte(moi(principal), requete.destinataireId());
        if (!ouverture.creee()) return ResponseEntity.ok(ouverture.conversation());
        return ResponseEntity.created(emplacement(ouverture.conversation().id())).body(ouverture.conversation());
    }

    /** Écrire à un organisme depuis sa fiche : la conversation s'ouvre avec le compte qui le représente. */
    @PostMapping("/conversations/organismes/{organismeId}")
    public ResponseEntity<ConversationResponse> ouvrirAvecOrganisme(@PathVariable UUID organismeId,
                                                                    @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ConversationService.Ouverture ouverture = conversationService.ouvrirAvecOrganisme(moi(principal), organismeId);
        if (!ouverture.creee()) return ResponseEntity.ok(ouverture.conversation());
        return ResponseEntity.created(emplacement(ouverture.conversation().id())).body(ouverture.conversation());
    }

    @PostMapping("/conversations/groupes")
    public ResponseEntity<ConversationDetailResponse> creerGroupe(@Valid @RequestBody GroupeRequest requete,
                                                                  @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ConversationDetailResponse groupe = conversationService.creerGroupe(moi(principal), requete);
        return ResponseEntity.created(emplacement(groupe.id())).body(groupe);
    }

    @GetMapping("/conversations/{id}")
    public ConversationDetailResponse obtenir(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.obtenir(id, moi(principal));
    }

    /** Nom et description d'un groupe (administrateur) ; un champ absent reste tel quel. */
    @PatchMapping("/conversations/{id}")
    public ConversationDetailResponse modifier(@PathVariable UUID id, @Valid @RequestBody ModificationGroupeRequest requete,
                                               @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.modifier(id, moi(principal), requete);
    }

    /** Supprime le groupe pour tous ses membres, avec ses messages (administrateur). */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> supprimerGroupe(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        conversationService.supprimerGroupe(id, moi(principal));
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/conversations/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ConversationDetailResponse changerPhoto(@PathVariable UUID id, @RequestPart("photo") MultipartFile photo,
                                                   @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.changerPhoto(id, moi(principal), photo);
    }

    @DeleteMapping("/conversations/{id}/photo")
    public ConversationDetailResponse retirerPhoto(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.retirerPhoto(id, moi(principal));
    }

    /** Nommer un membre administrateur ou lui retirer ce rôle. */
    @PatchMapping("/conversations/{id}/participants/{utilisateurId}")
    public ConversationDetailResponse changerRole(@PathVariable UUID id, @PathVariable UUID utilisateurId,
                                                  @Valid @RequestBody RoleParticipantRequest requete,
                                                  @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.changerRole(id, moi(principal), utilisateurId, requete.role());
    }

    /** Les membres que j'ai bloqués. */
    @GetMapping("/blocages")
    public List<MembreBloqueResponse> listerBlocages(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return blocageService.lister(moi(principal));
    }

    /** Bloquer un membre (idempotent) : plus aucun message entre nous dans notre conversation directe. */
    @PutMapping("/blocages/{utilisateurId}")
    public ResponseEntity<Void> bloquer(@PathVariable UUID utilisateurId, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        blocageService.bloquer(moi(principal), utilisateurId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/blocages/{utilisateurId}")
    public ResponseEntity<Void> debloquer(@PathVariable UUID utilisateurId, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        blocageService.debloquer(moi(principal), utilisateurId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/conversations/{id}/participants")
    public ConversationDetailResponse ajouterParticipants(@PathVariable UUID id,
                                                          @Valid @RequestBody AjoutParticipantsRequest requete,
                                                          @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.ajouterParticipants(id, moi(principal), requete.membreIds());
    }

    /** Retirer un membre (administrateur), ou quitter le groupe avec son propre identifiant. */
    @DeleteMapping("/conversations/{id}/participants/{utilisateurId}")
    public ResponseEntity<Void> retirerParticipant(@PathVariable UUID id, @PathVariable UUID utilisateurId,
                                                   @AuthenticationPrincipal UtilisateurPrincipal principal) {
        conversationService.retirerParticipant(id, moi(principal), utilisateurId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/conversations/{id}/messages")
    public PageMessagesResponse listerMessages(@PathVariable UUID id,
                                               @RequestParam(required = false)
                                               @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant avant,
                                               @RequestParam(defaultValue = "30") @Min(1) @Max(50) int taille,
                                               @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return messageService.lister(id, moi(principal), avant, taille);
    }

    @PostMapping(value = "/conversations/{id}/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MessageResponse> envoyer(@PathVariable UUID id, @Valid @RequestBody MessageRequest requete,
                                                   @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return cree(id, messageService.envoyer(id, moi(principal), requete.contenu()));
    }

    /** Même route, en multipart : un fichier ({@code fichier}) avec ou sans texte ({@code contenu}). */
    @PostMapping(value = "/conversations/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> envoyerAvecFichier(@PathVariable UUID id,
                                                              @RequestPart("fichier") MultipartFile fichier,
                                                              @RequestParam(required = false) String contenu,
                                                              @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return cree(id, messageService.envoyer(id, moi(principal), contenu, fichier));
    }

    /**
     * Le fichier joint, pour les participants seulement. Une image s'affiche, le reste se télécharge ;
     * {@code nosniff} et le bac à sable CSP empêchent qu'un fichier soit interprété comme une page.
     */
    @GetMapping("/conversations/{id}/messages/{messageId}/piece-jointe")
    public ResponseEntity<Resource> pieceJointe(@PathVariable UUID id, @PathVariable UUID messageId,
                                                @AuthenticationPrincipal UtilisateurPrincipal principal) {
        MessageService.FichierJoint fichier = messageService.lirePieceJointe(id, messageId, moi(principal));
        ContentDisposition disposition = (fichier.image() ? ContentDisposition.inline() : ContentDisposition.attachment())
            .filename(fichier.nom(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(fichier.type()))
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
            .header("X-Content-Type-Options", "nosniff")
            .header("Content-Security-Policy", "sandbox; default-src 'none'")
            .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
            .body(fichier.contenu());
    }

    private static ResponseEntity<MessageResponse> cree(UUID conversationId, MessageResponse message) {
        return ResponseEntity.created(URI.create("/api/messagerie/conversations/" + conversationId + "/messages/" + message.id()))
            .body(message);
    }

    @DeleteMapping("/conversations/{id}/messages/{messageId}")
    public ResponseEntity<Void> supprimerMessage(@PathVariable UUID id, @PathVariable UUID messageId,
                                                 @AuthenticationPrincipal UtilisateurPrincipal principal) {
        messageService.supprimer(id, messageId, moi(principal));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/conversations/{id}/lu")
    public ResponseEntity<Void> marquerLu(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        messageService.marquerLu(id, moi(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/non-lus")
    public NombreNonLusResponse compterNonLus(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return new NombreNonLusResponse(messageService.compterNonLus(moi(principal)));
    }

    private static UUID moi(UtilisateurPrincipal principal) {
        return principal.getUtilisateur().getId();
    }

    private static URI emplacement(UUID conversationId) {
        return URI.create("/api/messagerie/conversations/" + conversationId);
    }
}
