export type TypeNotification = 'MENTORAT' | 'EVENEMENT' | 'COMPTE';

export interface Notification {
  id: string;
  type: TypeNotification;
  titre: string;
  message: string;
  /** Route interne à ouvrir (« /evenements/… »), absente pour une simple information. */
  lien: string | null;
  lue: boolean;
  creeLe: string;
}

export interface PageNotifications {
  contenu: Notification[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
  nonLues: number;
}

