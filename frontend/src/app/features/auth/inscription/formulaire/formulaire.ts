import { Component, computed, inject, signal } from '@angular/core';
import { email, form, minLength, required, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';

import { AuthService } from '../../../../core/services/auth/auth-service';
import { FILIERES } from '../../../../core/data/filieres';

@Component({
  selector: 'app-formulaire',
  imports: [FormField, InputText, Message, RouterLink],
  templateUrl: './formulaire.html',
  styleUrl: './formulaire.scss',
})
export class Formulaire {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Le rôle vient du paramètre d'URL (/inscription/formulaire/ALUMNI)
  protected readonly role = signal(this.route.snapshot.paramMap.get('role') ?? 'VISITEUR');

  protected readonly filieres = FILIERES.map((f) => ({ label: f, value: f }));

  protected readonly libelleRole = computed(() => {
    switch (this.role()) {
      case 'ALUMNI': return 'Diplômé';
      case 'PERSONNEL': return 'Personnel EPT';
      case 'ORGANISME': return 'Organisme';
      default: return 'Visiteur';
    }
  });

  protected readonly estOrganisme = computed(() => this.role() === 'ORGANISME');
  protected readonly montreFiliere = computed(
    () => this.role() === 'ALUMNI' || this.role() === 'PERSONNEL'
  );

  protected readonly montreAnnee = computed(() => this.role() === 'ALUMNI');

  // Le modèle contient tous les champs possibles ; on n'utilise que ceux qui servent
  protected readonly modele = signal({
    nom: '',
    prenom: '',
    nomOrganisme: '',
    email: '',
    password: '',
    filiere: '',
    anneeSortie: '',
    telephone: ''
  });

  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nom, { message: 'Le nom est obligatoire' });
    required(champ.prenom, { message: 'Le prénom est obligatoire' });
    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: "Format d'email invalide" });
    required(champ.password, { message: 'Le mot de passe est obligatoire' });
    minLength(champ.password, 8, { message: 'Au moins 8 caractères' });
  });

  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherMdp = signal(false);

  sInscrire(): void {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);

    const m = this.modele();


    // On construit le corps adapté au rôle
    const corps: Record<string, unknown> = {
      nom: m.nom,
      prenom: m.prenom,
      email: m.email,
      password: m.password,
      role: this.role()
    };

    if (this.montreAnnee() && m.anneeSortie) {
      corps['anneeSortie'] = Number(m.anneeSortie);
    }
    if (this.montreFiliere()) {
      corps['filiere'] = m.filiere;
    }
    if (m.telephone) {
      corps['telephone'] = m.telephone;
    }
    if (this.estOrganisme()) {
      corps['nomOrganisme'] = m.nomOrganisme;
    }

    this.authService.inscrire(corps).subscribe({
      next: (res) => {
        this.enChargement.set(false);
        // On passe à l'écran OTP en transmettant l'email
        this.router.navigate(['/inscription/verification'], {
          queryParams: { email: res.email }
        });
      },
      error: (err) => {
        this.enChargement.set(false);
        this.messageErreur.set(err?.error?.message ?? "L'inscription a échoué. Réessayez.");
      }
    });
  }
}
