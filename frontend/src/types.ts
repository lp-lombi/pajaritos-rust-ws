export type LoggedUser = {
  id: number;
  username: string;
  role?: {
    id: number;
    descripcion: string;
  };
};

export type Player = {
  id: number;
  steamid: string;
  tag: string;
  subscription?: Subscription;
};

export type Subscription = {
  id: number;
  validFrom: string;
  validUntil: string;
  playerId: number;
};
