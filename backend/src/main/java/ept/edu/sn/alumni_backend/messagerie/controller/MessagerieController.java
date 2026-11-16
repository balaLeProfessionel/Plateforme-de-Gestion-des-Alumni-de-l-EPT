package ept.edu.sn.alumni_backend.messagerie.controller;

import java.net.URI;
import java.time.Instant;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.AjoutParticipantsRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationDetailResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.GroupeRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.MessageRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.MessageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.NombreNonLusResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.OuvertureDirecteRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.PageMessagesResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.RenommageGroupeRequest;
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

    @PatchMapping("/conversations/{id}")
    public ConversationDetailResponse renommer(@PathVariable UUID id, @Valid @RequestBody RenommageGroupeRequest requete,
                                               @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return conversationService.renommer(id, moi(principal), requete.nom());
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

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageResponse> envoyer(@PathVariable UUID id, @Valid @RequestBody MessageRequest requete,
                                                   @AuthenticationPrincipal UtilisateurPrincipal principal) {
        MessageResponse message = messageService.envoyer(id, moi(principal), requete.contenu());
        return ResponseEntity.created(URI.create("/api/messagerie/conversations/" + id + "/messages/" + message.id()))
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
