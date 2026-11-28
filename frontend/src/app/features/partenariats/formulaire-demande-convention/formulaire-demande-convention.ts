import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, Injector, input, OnInit, output, signal } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { Convention } from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';

/** Demande de convention-cadre : nouvelle, ou corrigée tant que l’école ne l’a pas prise en examen (`initial`). */
@Component({
  selector: 'app-formulaire-demande-convention',
  imports: [FormField],
  templateUrl: './formulaire-demande-convention.html',
  styleUrl: '../../mobilites/formulaire-accueil/formulaire-accueil.scss',
})
export class FormulaireDemandeConvention implements OnInit {
  private readonly service = inject(ConventionsPartenariatService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly initial = input<Convention | null>(null);
  readonly enregistree = output<Convention>();
  readonly annulee = output<void>();

  protected readonly modele = signal({ objet: '', domaines: '', message: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.objet, { message: 'L’objet est obligatoire.' });
    maxLength(champ.objet, 200, { message: '200 caractères au maximum.' });
    maxLength(champ.domaines, 1000, { message: '1 000 caractères au maximum.' });
    required(champ.message, { message: 'Présentez votre demande.' });
    maxLength(champ.message, 3000, { message: '3 000 caractères au maximum.' });
  });
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  ngOnInit(): void {
    const c = this.initial();
    if (c) this.modele.set({ objet: c.objet, domaines: c.domaines ?? '', message: c.message ?? '' });
  }

  protected envoyer(evenement: Event): void {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }
    if (this.enCours()) return;
    const s = this.modele();
    const demande = { objet: s.objet.trim(), domaines: s.domaines.trim() || null, message: s.message.trim() };
    const initial = this.initial();
    this.enCours.set(true);
    this.erreur.set(null);
    (initial ? this.service.modifierDemande(initial.id, demande) : this.service.demander(demande)).subscribe({
      next: (convention) => {
        this.enCours.set(false);
        this.enregistree.emit(convention);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’envoi a échoué. Réessayez.');
      },
    });
  }
}
