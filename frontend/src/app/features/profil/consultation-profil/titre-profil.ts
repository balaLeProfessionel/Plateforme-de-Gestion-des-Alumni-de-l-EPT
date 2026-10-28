import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';

/** Titre d'onglet de /profil/:id : « Mon profil » quand l'identifiant est le mien. */
export const titreProfil: ResolveFn<string> = (route) =>
  route.paramMap.get('id') === inject(AuthService).utilisateur()?.id
    ? 'Mon profil | EPT Alumni'
    : 'Profil membre | EPT Alumni';
