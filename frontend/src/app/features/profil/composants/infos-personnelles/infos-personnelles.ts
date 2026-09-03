import { Component, input, linkedSignal, output } from '@angular/core';
import { form, FormField, pattern } from '@angular/forms/signals';
import { InputText } from 'primeng/inputtext';
import { Profil, ProfilRequest } from '../../../../core/services/models/profil.model';
import { MessageSection } from '../message-section.model';

// Modele du formulaire : que des chaines non nulles, car c'est ce que
// manipulent les <input> natifs. La conversion depuis/vers le Profil de
// l'API se fait dans les deux fonctions ci-dessous.
interface ModeleInfos {
  bio: string;
  villeResidence: string;
  posteActuel: string;
  lienLinkedin: string;
  lienPortfolio: string;
  telephone: string;
  dateNaissance: string;
}

const MODELE_VIDE: ModeleInfos = {
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

  // Aucun champ obligatoire : le profil se remplit librement. On controle
  // seulement le format des liens, et uniquement s'ils sont renseignes.
  protected readonly formulaire = form(this.modele, (champ) => {
    pattern(champ.lienLinkedin, URL_OU_VIDE, {
      message: 'Entrez une adresse complete, commencant par https://'
    });
    pattern(champ.lienPortfolio, URL_OU_VIDE, {
      message: 'Entrez une adresse complete, commencant par https://'
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
      bio: valeurs.bio.trim(),
      villeResidence: valeurs.villeResidence.trim(),
      posteActuel: valeurs.posteActuel.trim(),
      lienLinkedin: valeurs.lienLinkedin.trim(),
      lienPortfolio: valeurs.lienPortfolio.trim(),
      telephone: valeurs.telephone.trim(),
      // Exception : une date vide est omise du corps de la requete, une
      // chaine vide n'etant pas une date valide cote backend.
      dateNaissance: valeurs.dateNaissance || undefined
    });
  }
}
