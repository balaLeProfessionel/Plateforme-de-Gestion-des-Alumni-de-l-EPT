import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, output, signal, viewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { FilieresService } from '../../../../core/services/filieres/filieres';
import { ChefPossible, FiliereAdmin } from '../../../../core/services/models/filiere.model';

type Panneau = 'nom' | 'fusion' | 'chef';

/**
 * Une filière et ses actions : renommer, retirer ou proposer de nouveau, fusionner dans une autre, et, pour le
 * super administrateur, désigner ou retirer le chef de département. Un seul panneau ouvert à la fois.
 */
@Component({
  selector: 'app-ligne-filiere',
  imports: [DatePipe],
  templateUrl: './ligne-filiere.html',
  styleUrls: ['../../formulaire-admin.scss', './ligne-filiere.scss'],
})
export class LigneFiliere {
  private readonly service = inject(FilieresService);
  private readonly injector = inject(Injector);

  readonly filiere = input.required<FiliereAdmin>();
  /** Toutes les filières : les autres sont les cibles possibles d’une fusion. */
  readonly autres = input.required<readonly FiliereAdmin[]>();
  readonly estSuper = input(false);
  readonly chefsPossibles = input<readonly ChefPossible[]>([]);
  /** L’action a réussi : le message dit ce qui a été fait. */
  readonly modifiee = output<string>();

  protected readonly panneau = signal<Panneau | null>(null);
  protected readonly saisie = signal('');
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly cibles = computed(() => this.autres().filter((f) => f.id !== this.filiere().id));
  protected readonly cibleChoisie = computed(() => this.cibles().find((f) => f.id === this.saisie()) ?? null);
  private readonly premierChamp = viewChild<ElementRef<HTMLInputElement | HTMLSelectElement>>('premierChamp');

  protected ouvrir(panneau: Panneau): void {
    const filiere = this.filiere();
    this.saisie.set(panneau === 'nom' ? filiere.nom : panneau === 'chef' ? filiere.chef?.id ?? '' : '');
    this.erreur.set(null);
    this.panneau.set(panneau);
    afterNextRender(() => this.premierChamp()?.nativeElement.focus(), { injector: this.injector });
  }

  protected saisir(evenement: Event): void {
    this.saisie.set((evenement.target as HTMLInputElement | HTMLSelectElement).value);
  }

  protected fermer(): void {
    this.panneau.set(null);
  }

  protected renommer(evenement: Event): void {
    evenement.preventDefault();
    const nom = this.saisie().trim();
    if (!nom) { this.erreur.set('Indiquez le nouveau nom.'); return; }
    if (nom.length > 120) { this.erreur.set('120 caractères au maximum.'); return; }
    this.executer(this.service.renommer(this.filiere().id, nom), (f) => `La filière s’appelle désormais « ${f.nom} ».`);
  }

  protected changerActivite(): void {
    const active = !this.filiere().active;
    this.executer(this.service.changerActivite(this.filiere().id, active), (f) => active
      ? `« ${f.nom} » est de nouveau proposée.`
      : `« ${f.nom} » n’est plus proposée. Les comptes qui l’ont la gardent.`);
  }

  protected fusionner(evenement: Event): void {
    evenement.preventDefault();
    const cible = this.cibleChoisie();
    if (!cible) { this.erreur.set('Choisissez la filière qui reçoit les comptes.'); return; }
    const source = this.filiere().nom;
    this.executer(this.service.fusionner(this.filiere().id, cible.id),
      (f) => `« ${source} » est fusionnée dans « ${f.nom} », qui compte désormais ${f.nombreComptes} compte${f.nombreComptes > 1 ? 's' : ''}.`);
  }

  protected designer(evenement: Event): void {
    evenement.preventDefault();
    if (!this.saisie()) { this.erreur.set('Choisissez le chef de département.'); return; }
    this.executer(this.service.designerChef(this.filiere().id, this.saisie()),
      (f) => `${f.chef?.prenom} ${f.chef?.nom} dirige désormais le département ${f.nom}. Les personnes concernées sont prévenues par e-mail.`);
  }

  protected retirerChef(): void {
    this.executer(this.service.retirerChef(this.filiere().id),
      (f) => `Le département ${f.nom} n’a plus de chef. La personne en est prévenue par e-mail.`);
  }

  private executer(requete: Observable<FiliereAdmin>, message: (resultat: FiliereAdmin) => string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (resultat) => {
        this.enCours.set(false);
        this.panneau.set(null);
        this.modifiee.emit(message(resultat));
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }
}
