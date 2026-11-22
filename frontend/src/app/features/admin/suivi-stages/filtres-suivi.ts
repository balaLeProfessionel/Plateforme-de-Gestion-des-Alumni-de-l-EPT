import { ParamMap } from '@angular/router';
import { FiltresSuivi } from '../../../core/services/models/stage.model';

/** Filtres du suivi lus dans l’URL (q, filiere, sansEncadrant) : on les retrouve en revenant d’un organisme. */
export function filtresDepuis(params: ParamMap): FiltresSuivi {
  return { texte: params.get('q') ?? '', filiere: params.get('filiere') ?? '', sansEncadrant: params.get('sansEncadrant') === 'true' };
}

/** Paramètres d’URL non vides. */
export function parametresFiltres(filtres: FiltresSuivi): Record<string, string> {
  const parametres: Record<string, string> = {};
  if (filtres.texte.trim()) parametres['q'] = filtres.texte.trim();
  if (filtres.filiere) parametres['filiere'] = filtres.filiere;
  if (filtres.sansEncadrant) parametres['sansEncadrant'] = 'true';
  return parametres;
}
