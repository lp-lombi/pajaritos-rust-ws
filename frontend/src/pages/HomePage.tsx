import React from 'react';
import { Player } from '../types';
import './HomePage.css';
import PlayerRegistration from '../sections/PlayerRegistration';

type HomePageProps = {
  steamid: string;
  tag: string;
  loadSubscription: boolean;
  players: Player[];
  loading: boolean;
  onSteamidChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onLoadSubscriptionChange: (value: boolean) => void;
  onCreatePlayer: (event: React.FormEvent<HTMLFormElement>) => void;
  onDeletePlayer: (playerId: number) => Promise<void>;
  onUpdatePlayerTag: (playerId: number, nextTag: string) => Promise<void>;
};

function HomePage({
  steamid,
  tag,
  loadSubscription,
  players,
  loading,
  onSteamidChange,
  onTagChange,
  onLoadSubscriptionChange,
  onCreatePlayer,
  onDeletePlayer,
  onUpdatePlayerTag,
}: HomePageProps) {
  return (
    <PlayerRegistration
      steamid={steamid}
      tag={tag}
      loadSubscription={loadSubscription}
      players={players}
      loading={loading}
      onSteamidChange={onSteamidChange}
      onTagChange={onTagChange}
      onLoadSubscriptionChange={onLoadSubscriptionChange}
      onSubmit={onCreatePlayer}
      onDeletePlayer={onDeletePlayer}
      onUpdatePlayerTag={onUpdatePlayerTag}
    />
  );
}

export default HomePage;
