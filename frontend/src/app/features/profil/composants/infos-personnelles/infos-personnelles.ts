import { Component, input, linkedSignal, output } from '@angular/core';
import { form, FormField, maxLength, pattern, required } from '@angular/forms/signals';
import { InputText } from 'primeng/inputtext';
import { Profil, ProfilRequest } from '../../../../core/services/models/profil.model';
import { MessageSection } from '../message-section.model';

// Modele du formulaire : que des chaines non nulles, car c'est ce que
// manipulent les <input> natifs. La conversion depuis/vers le Profil de
// l'API se fait dans les deux fonctions ci-dessous.
interface ModeleInfos {
  nom: string;
  prenom: string;
  bio: string;
  villeResidence: string;
  posteActuel: string;
  lienLinkedin: string;
  lienPortfolio: string;
  telephone: string;
  dateNaissance: string;
}

const MODELE_VIDE: ModeleInfos = {
  nom: '',
  prenom: '',
  bio: '',
  villeResidence: '',
  posteActuel: '',
  lienLinkedin: '',
  lienPortfolio: '',
  telephone: '',
  dateNaissance: ''
};

function versModele(profil: Profil | null): ModeleInfos {
  if (!profil) {
    return { ...MODELE_VIDE };
  }
  return {
    nom: profil.nom,
    prenom: profil.prenom,
    bio: profil.bio ?? '',
    villeResidence: profil.villeResidence ?? '',
    posteActuel: profil.posteActuel ?? '',
    lienLinkedin: profil.lienLinkedin ?? '',
    lienPortfolio: profil.lienPortfolio ?? '',
    telephone: profil.telephone ?? '',
    dateNaissance: profil.dateNaissance ?? ''
  };
}

// Accepte une URL http(s) OU une valeur vide : le champ reste facultatif.
const URL_OU_VIDE = /^(https?:\/\/\S+)?$/;

@Component({
  selector: 'app-infos-personnelles',
  imports: [FormField, InputText],
  templateUrl: './infos-personnelles.html',
  styleUrl: './infos-personnelles.scss'
})
export class InfosPersonnelles {
  // Donnees affichees. Peut arriver a null puis se remplir quand la page
  // a recupere le profil : linkedSignal reinitialise alors le formulaire.
  readonly profil = input<Profil | null>(null);

  // Retour visuel pilote par la page : le composant ne sait rien du reseau.
  readonly enSauvegarde = input(false);
  readonly message = input<MessageSection | null>(null);

  readonly sauvegarder = output<ProfilRequest>();

  // L'input est en lecture seule : on en derive une copie locale editable.
  // linkedSignal la resynchronise a chaque nouveau profil recu.
  protected readonly modele = linkedSignal(() => versModele(this.profil()));

  // L'identité est obligatoire. Les autres informations restent facultatives.
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nom, { message: 'Le nom est obligatoire' });
    maxLength(champ.nom, 100, { message: '100 caractères maximum' });
    required(champ.prenom, { message: 'Le prénom est obligatoire' });
    maxLength(champ.prenom, 100, { message: '100 caractères maximum' });
    maxLength(champ.bio, 1000, { message: '1000 caractères maximum' });
    maxLength(champ.villeResidence, 255, { message: '255 caractères maximum' });
    maxLength(champ.posteActuel, 255, { message: '255 caractères maximum' });
    maxLength(champ.telephone, 30, { message: '30 caractères maximum' });
    pattern(champ.lienLinkedin, URL_OU_VIDE, {
      message: 'Entrez une adresse complète, commençant par https://'
    });
    pattern(champ.lienPortfolio, URL_OU_VIDE, {
      message: 'Entrez une adresse complète, commençant par https://'
    });
  });

  protected valider(): void {
    if (this.formulaire().invalid()) {
      return;
    }
    const valeurs = this.modele();
    // On emet les chaines telles quelles, vide compris : une chaine vide
    // est la facon dont l'utilisateur efface un champ deja renseigne.
    this.sauvegarder.emit({
      nom: valeurs.nom.trim(),
      prenom: valeurs.prenom.trim(),
      bio: valeurs.bio.trim(),
      villeResidence: valeurs.villeResidence.trim(),
      posteActuel: valeurs.posteActuel.trim(),
      lienLinkedin: valeurs.lienLinkedin.trim(),
      lienPortfolio: valeurs.lienPortfolio.trim(),
      telephone: valeurs.telephone.trim(),
      dateNaissance: valeurs.dateNaissance || undefined,
      effacerDateNaissance: !valeurs.dateNaissance && Boolean(this.profil()?.dateNaissance)
    });
  }
}
