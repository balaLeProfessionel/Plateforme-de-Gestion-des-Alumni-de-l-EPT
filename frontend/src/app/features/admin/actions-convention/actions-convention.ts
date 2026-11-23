import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Convention, STATUTS_EN_COURS } from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';

type Panneau = 'signature' | 'refus' | 'resiliation' | 'modification' | null;
interface Saisie { objet: string; domaines: string; dateSignature: string; dateDebut: string; dateFin: string; motif: string }

/** Aujourd’hui au format des champs date, à Thiès comme le serveur. */
function aujourdhui(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Dakar' }).format(new Date());
}

/**
 * Décisions du service des Relations extérieures sur une convention, selon son statut : examen, négociation,
 * signature (dates de validité), refus ou résiliation (motif communiqué à l’organisme), correction.
 */
@Component({
  selector: 'app-actions-convention',
  templateUrl: './actions-convention.html',
  styleUrls: ['../formulaire-admin.scss', './actions-convention.scss'],
})
export class ActionsConvention {
  private readonly service = inject(ConventionsPartenariatService);

  readonly convention = input.required<Convention>();
  readonly modifiee = output<{ convention: Convention; message: string }>();

  protected readonly panneau = signal<Panneau>(null);
  protected readonly saisie = signal<Saisie>({ objet: '', domaines: '', dateSignature: '', dateDebut: '', dateFin: '', motif: '' });
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly maximumSignature = aujourdhui();

  protected readonly statut = computed(() => this.convention().statut);
  protected readonly modifiable = computed(() => STATUTS_EN_COURS.includes(this.statut()) || this.statut() === 'ACTIVE');
  protected readonly aucuneAction = computed(() => !this.modifiable());

  protected ouvrir(panneau: Panneau): void {
    const c = this.convention();
    this.saisie.set({
      objet: c.objet, domaines: c.domaines ?? '', dateSignature: c.dateSignature ?? '', dateDebut: c.dateDebut ?? '', dateFin: c.dateFin ?? '', motif: '',
    });
    this.erreur.set(null);
    this.panneau.set(panneau);
  }

  protected champ(nom: keyof Saisie, evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.saisie.update((s) => ({ ...s, [nom]: valeur }));
  }

  protected examiner(): void {
    this.executer(this.service.examiner(this.convention().id), 'La demande est en examen ; l’organisme en est prévenu.');
  }

  protected negocier(): void {
    this.executer(this.service.negocier(this.convention().id), 'La convention passe en négociation ; l’organisme en est prévenu.');
  }

  protected confirmer(evenement: Event): void {
    evenement.preventDefault();
    const s = this.saisie();
    const id = this.convention().id;
    switch (this.panneau()) {
      case 'signature': {
        const erreur = this.verifierDates(s);
        if (erreur) { this.erreur.set(erreur); return; }
        this.executer(this.service.activer(id, { dateSignature: s.dateSignature, dateDebut: s.dateDebut, dateFin: s.dateFin }),
          'La convention est active : l’organisme est partenaire de l’EPT.');
        return;
      }
      case 'refus':
      case 'resiliation': {
        const motif = s.motif.trim();
        if (!motif) { this.erreur.set('Le motif est obligatoire : il est communiqué à l’organisme.'); return; }
        this.executer(this.panneau() === 'refus' ? this.service.refuser(id, motif) : this.service.resilier(id, motif),
          this.panneau() === 'refus' ? 'La demande est refusée ; l’organisme reçoit le motif.' : 'La convention est résiliée ; l’organisme reçoit le motif.');
        return;
      }
      case 'modification': {
        if (!s.objet.trim()) { this.erreur.set('L’objet est obligatoire.'); return; }
        const active = this.statut() === 'ACTIVE';
        if (active) {
          const erreur = this.verifierDates(s);
          if (erreur) { this.erreur.set(erreur); return; }
        }
        this.executer(this.service.modifier(id, {
          objet: s.objet.trim(), domaines: s.domaines.trim() || null,
          ...(active ? { dateSignature: s.dateSignature, dateDebut: s.dateDebut, dateFin: s.dateFin } : {}),
        }), 'La convention est modifiée.');
        return;
      }
    }
  }

  private verifierDates(s: Saisie): string | null {
    if (!s.dateSignature || !s.dateDebut || !s.dateFin) return 'Indiquez les dates de signature, de début et de fin.';
    if (s.dateSignature > this.maximumSignature) return 'La date de signature ne peut pas être dans le futur.';
    if (s.dateFin < s.dateDebut) return 'La date de fin doit suivre la date de début.';
    if (s.dateFin < this.maximumSignature) return 'La date de fin est déjà passée.';
    return null;
  }

  private executer(requete: Observable<Convention>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (convention) => {
        this.enCours.set(false);
        this.panneau.set(null);
        this.modifiee.emit({ convention, message });
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(e.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }
}
