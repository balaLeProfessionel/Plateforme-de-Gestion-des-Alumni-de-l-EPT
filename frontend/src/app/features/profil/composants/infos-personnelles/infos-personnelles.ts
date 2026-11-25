import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { form, FormField, maxLength, pattern, required } from '@angular/forms/signals';
import { InputText } from 'primeng/inputtext';
import { PAYS } from '../../../../core/data/pays';
import { SITUATIONS } from '../../../../core/data/situations';
import { IdentiteExtraite } from '../../../../core/services/models/import-cv.model';
import {
  Profil,
  ProfilRequest,
  SituationActuelle
} from '../../../../core/services/models/profil.model';
import { MessageSection } from '../message-section.model';

// Modele du formulaire : que des chaines non nulles, car c'est ce que
// manipulent les <input> natifs. La conversion depuis/vers le Profil de
// l'API se fait dans les deux fonctions ci-dessous.
interface ModeleInfos {
  nom: string;
  prenom: string;
  bio: string;
  villeResidence: string;
  paysResidence: string;
  situationActuelle: SituationActuelle | '';
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
  paysResidence: '',
  situationActuelle: '',
  posteActuel: '',
  lienLinkedin: '',
  lienPortfolio: '',
  telephone: '',
  dateNaissance: ''
};

// Champs qu'un CV peut pre-remplir
const CHAMPS_CV = [
  'nom',
  'prenom',
  'bio',
  'villeResidence',
  'paysResidence',
  'posteActuel',
  'lienLinkedin',
  'lienPortfolio',
  'telephone'
] as const satisfies readonly (keyof ModeleInfos & keyof IdentiteExtraite)[];

function versModele(profil: Profil | null): ModeleInfos {
  if (!profil) {
    return { ...MODELE_VIDE };
  }
  return {
    nom: profil.nom,
    prenom: profil.prenom,
    bio: profil.bio ?? '',
    villeResidence: profil.villeResidence ?? '',
    paysResidence: profil.paysResidence ?? '',
    situationActuelle: profil.situationActuelle ?? '',
    posteActuel: profil.posteActuel ?? '',
    lienLinkedin: profil.lienLinkedin ?? '',
    lienPortfolio: profil.lienPortfolio ?? '',
    telephone: profil.telephone ?? '',
    dateNaissance: profil.dateNaissance ?? ''
  };
}

// Le CV ne complete que les champs vides : ce que le membre a deja saisi
// n'est jamais remplace.
function completerDepuisCv(modele: ModeleInfos, cv: IdentiteExtraite | null): ModeleInfos {
  if (!cv) return modele;
  const complete = { ...modele };
  for (const champ of CHAMPS_CV) {
    const valeur = cv[champ];
    if (!complete[champ] && valeur) {
      complete[champ] = valeur;
    }
  }
  return complete;
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
  // Identite lue dans un CV, pour completer les champs encore vides
  readonly prerempli = input<IdentiteExtraite | null>(null);

  // Retour visuel pilote par la page : le composant ne sait rien du reseau.
  readonly enSauvegarde = input(false);
  readonly message = input<MessageSection | null>(null);

  readonly sauvegarder = output<ProfilRequest>();

  protected readonly pays = PAYS;
  protected readonly situations = SITUATIONS;

  // La situation professionnelle ne concerne que les alumni
  protected readonly afficherSituation = computed(() => this.profil()?.role === 'ALUMNI');

  // L'input est en lecture seule : on en derive une copie locale editable.
  // linkedSignal la resynchronise a chaque nouveau profil recu.
  protected readonly modele = linkedSignal(() =>
    // Le CV n'est applique qu'une fois le profil recu : avant, tous les champs
    // paraissent vides et l'identite du CV remplacerait celle du compte.
    completerDepuisCv(versModele(this.profil()), this.profil() ? this.prerempli() : null)
  );

  // Au moins un champ vide a ete complete par le CV
  protected readonly completeParCv = computed(() => {
    const avant = versModele(this.profil());
    const apres = completerDepuisCv(avant, this.profil() ? this.prerempli() : null);
    return CHAMPS_CV.some((champ) => avant[champ] !== apres[champ]);
  });

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

  // Publique : la page peut demander l'enregistrement depuis son propre
  // bouton (« Enregistrer et continuer »). Renvoie false si la saisie est invalide.
  valider(): boolean {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return false;
    }
    const valeurs = this.modele();
    // On emet les chaines telles quelles, vide compris : une chaine vide
    // est la facon dont l'utilisateur efface un champ deja renseigne.
    this.sauvegarder.emit({
      nom: valeurs.nom.trim(),
      prenom: valeurs.prenom.trim(),
      bio: valeurs.bio.trim(),
      villeResidence: valeurs.villeResidence.trim(),
      paysResidence: valeurs.paysResidence,
      ...(this.afficherSituation() ? { situationActuelle: valeurs.situationActuelle } : {}),
      posteActuel: valeurs.posteActuel.trim(),
      lienLinkedin: valeurs.lienLinkedin.trim(),
      lienPortfolio: valeurs.lienPortfolio.trim(),
      telephone: valeurs.telephone.trim(),
      dateNaissance: valeurs.dateNaissance || undefined,
      effacerDateNaissance: !valeurs.dateNaissance && Boolean(this.profil()?.dateNaissance)
    });
    return true;
  }
}
