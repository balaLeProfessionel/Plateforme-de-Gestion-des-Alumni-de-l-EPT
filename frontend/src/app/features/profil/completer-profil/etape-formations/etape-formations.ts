import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { OrganismeService } from '../../../../core/services/organisme/organisme-service';
import { Formation } from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { MessageSection } from '../../composants/message-section.model';
import { EtatCartes, ETAT_CARTES_VIDE } from '../../composants/etat-carte.model';
import {
  DemandeFormation,
  ListeFormations
} from '../../composants/liste-formations/liste-formations';
import { NavigationEtapes } from '../../composants/navigation-etapes/navigation-etapes';

// Issue d'un enregistrement unitaire au sein d'un envoi groupe
type Resultat =
  | { cle: string; id: string | null; ok: true; formation: Formation }
  | { cle: string; id: string | null; ok: false; texte: string };

// Etape 2 du parcours : les formations.
// Enregistrement global : l'utilisateur ajoute autant de cartes qu'il veut
// et les enregistre en une fois.
@Component({
  selector: 'app-etape-formations',
  imports: [ListeFormations, NavigationEtapes],
  templateUrl: './etape-formations.html',
  styleUrl: './etape-formations.scss'
})
export class EtapeFormations {
  private readonly profilService = inject(ProfilService);
  private readonly organismeService = inject(OrganismeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly formations = signal<Formation[]>([]);
  // Cartes vierges en cours de saisie. Elles vivent ici et non dans la liste :
  // la page est la seule a savoir quelles creations ont abouti.
  protected readonly brouillons = signal<string[]>([]);
  protected readonly etat = signal<EtatCartes>(ETAT_CARTES_VIDE);
  private compteurBrouillons = 0;

  // L'autocomplete ne fait aucun appel : c'est ici qu'on interroge le service
  // et qu'on redescend les resultats par input.
  protected readonly suggestions = signal<OrganismeSuggestion[]>([]);
  protected readonly enRechercheOrganisme = signal(false);

  constructor() {
    this.charger();
  }

  protected rechercherOrganismes(texte: string): void {
    this.enRechercheOrganisme.set(true);
    this.organismeService.rechercherOrganismes(texte).subscribe({
      next: (resultats) => {
        this.enRechercheOrganisme.set(false);
        this.suggestions.set(resultats);
      },
      error: () => {
        this.enRechercheOrganisme.set(false);
        this.suggestions.set([]);
      }
    });
  }

  protected ajouterBrouillon(): void {
    this.compteurBrouillons += 1;
    this.brouillons.update((cles) => [...cles, `nouvelle-formation-${this.compteurBrouillons}`]);
  }

  protected abandonnerBrouillon(cle: string): void {
    this.brouillons.update((cles) => cles.filter((c) => c !== cle));
    this.retirerMessage(cle);
  }

  // Les endpoints sont unitaires : un envoi groupe est donc N requetes.
  // Chacune est isolee par catchError, pour qu'un echec n'annule pas les
  // autres et que l'on sache exactement lesquelles ont abouti.
  protected enregistrerTout(demandes: DemandeFormation[]): void {
    if (demandes.length === 0) {
      // Rien de nouveau ni de modifie : on passe simplement a la suite
      this.etapeSuivante();
      return;
    }

    this.etat.set({
      clesEnCours: demandes.map((d) => d.cle),
      messages: {},
      messageGlobal: null
    });

    const appels = demandes.map((demande) => {
      const requete =
        demande.id === null
          ? this.profilService.creerFormation(demande.donnees)
          : this.profilService.modifierFormation(demande.id, demande.donnees);

      return requete.pipe(
        map((formation): Resultat => ({
          cle: demande.cle,
          id: demande.id,
          ok: true,
          formation
        })),
        catchError((err: { error?: { message?: string } }) =>
          of<Resultat>({
            cle: demande.cle,
            id: demande.id,
            ok: false,
            texte: err?.error?.message ?? "Échec de l'enregistrement."
          })
        )
      );
    });

    forkJoin(appels).subscribe((resultats) => this.appliquerResultats(resultats));
  }

  protected supprimer(id: string): void {
    this.etat.set({ clesEnCours: [id], messages: {}, messageGlobal: null });

    this.profilService.supprimerFormation(id).subscribe({
      next: () => {
        this.etat.set(ETAT_CARTES_VIDE);
        this.formations.update((liste) => liste.filter((f) => f.id !== id));
      },
      error: (err: { error?: { message?: string } }) => {
        this.etat.set({
          clesEnCours: [],
          messages: {
            [id]: {
              type: 'erreur',
              texte: err?.error?.message ?? 'Échec de la suppression.'
            }
          },
          messageGlobal: null
        });
      }
    });
  }

  protected etapeSuivante(): void {
    this.router.navigate(['/completer-profil/experiences']);
  }

  // On met a jour la liste a partir des reponses du serveur, sans la
  // recharger : recharger remplacerait aussi les cartes en echec et
  // effacerait la saisie que l'utilisateur doit pouvoir corriger.
  private appliquerResultats(resultats: Resultat[]): void {
    const reussis = resultats.filter((r): r is Extract<Resultat, { ok: true }> => r.ok);
    const echecs = resultats.filter((r): r is Extract<Resultat, { ok: false }> => !r.ok);

    const creees = reussis.filter((r) => r.id === null).map((r) => r.formation);
    const modifiees = new Map(
      reussis.filter((r) => r.id !== null).map((r) => [r.formation.id, r.formation])
    );

    this.formations.update((liste) => [
      // Une carte en echec conserve son objet d'origine : son formulaire
      // n'est donc pas reinitialise et la saisie reste a l'ecran.
      ...liste.map((f) => modifiees.get(f.id) ?? f),
      ...creees
    ]);

    // Les brouillons enregistres cedent la place a leur carte definitive
    const clesReussies = new Set(reussis.map((r) => r.cle));
    this.brouillons.update((cles) => cles.filter((c) => !clesReussies.has(c)));

    if (echecs.length === 0) {
      this.etat.set(ETAT_CARTES_VIDE);
      this.etapeSuivante();
      return;
    }

    const messages: Record<string, MessageSection> = {};
    for (const echec of echecs) {
      messages[echec.cle] = { type: 'erreur', texte: echec.texte };
    }

    this.etat.set({
      clesEnCours: [],
      messages,
      messageGlobal: {
        type: 'erreur',
        texte: this.synthese(reussis.length, echecs.length)
      }
    });
  }

  private synthese(reussies: number, echecs: number): string {
    const debut =
      reussies === 0
        ? 'Aucune formation enregistrée'
        : `${reussies} formation${reussies > 1 ? 's' : ''} enregistrée${reussies > 1 ? 's' : ''}`;
    return `${debut}, ${echecs} en échec. Corrigez les cartes signalées puis réessayez.`;
  }

  private charger(): void {
    this.profilService.listerFormations().subscribe({
      next: (liste) => {
        this.formations.set(liste);
        this.mettreEnAvant(liste);
      },
      error: () =>
        this.etat.set({
          clesEnCours: [],
          messages: {},
          messageGlobal: {
            type: 'erreur',
            texte: 'Impossible de charger vos formations.'
          }
        })
    });
  }

  private mettreEnAvant(liste: Formation[]): void {
    const id = this.route.snapshot.queryParamMap.get('modifier');
    if (!id) return;
    if (!liste.some((formation) => formation.id === id)) {
      this.etat.update((etat) => ({
        ...etat,
        messageGlobal: { type: 'erreur', texte: 'Cette formation n’existe plus.' }
      }));
      return;
    }
    requestAnimationFrame(() => {
      const element = document.getElementById(`formation-${id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element?.focus({ preventScroll: true });
    });
  }

  private retirerMessage(cle: string): void {
    const { [cle]: _retire, ...reste } = this.etat().messages;
    this.etat.update((etat) => ({ ...etat, messages: reste }));
  }
}
