import { Pipe, PipeTransform } from '@angular/core';

/** Taille lisible d’un fichier : « 820 Ko », « 1,4 Mo ». */
@Pipe({ name: 'taille' })
export class TaillePipe implements PipeTransform {
  transform(octets: number): string {
    if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`;
    return `${(octets / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
  }
}
