// @flow

import * as React from 'react';
import {
  getGames,
  updateGame,
  type Game,
} from '../Utils/GDevelopServices/Game';
import AuthenticatedUserContext from '../Profile/AuthenticatedUserContext';

export type GamesList = {|
  games: ?Array<Game>,
  gamesFetchingError: ?Error,
  fetchGames: () => Promise<void>,
  onGameUpdated: (updatedGame: Game) => void,
  markGameAsSavedIfRelevant: (gameId: string) => Promise<void>,
|};

const useGamesList = (): GamesList => {
  const authenticatedUser = React.useContext(AuthenticatedUserContext);
  const gamesFetchingPromise = React.useRef<?Promise<any>>(null);
  const {
    authenticated,
    firebaseUser,
    getAuthorizationHeader,
  } = authenticatedUser;

  const [games, setGames] = React.useState<?Array<Game>>(null);
  const [gamesFetchingError, setGamesFetchingError] = React.useState<?Error>(
    null
  );

  const fetchGames = React.useCallback(
    async (): Promise<void> => {
      if (!authenticated || !firebaseUser) {
        setGames(null);
        return;
      }
      if (gamesFetchingPromise.current) return gamesFetchingPromise.current;

      try {
        setGamesFetchingError(null);
        gamesFetchingPromise.current = getGames(
          getAuthorizationHeader,
          firebaseUser.uid
        );
        const fetchedGames = await gamesFetchingPromise.current;
        setGames(fetchedGames);
      } catch (error) {
        console.error('Error while loading user games.', error);
        setGamesFetchingError(error);
      } finally {
        gamesFetchingPromise.current = null;
      }
    },
    [authenticated, firebaseUser, getAuthorizationHeader]
  );

  const onGameUpdated = React.useCallback(
    (updatedGame: Game) => {
      if (!games) return;
      setGames(
        games.map(game => (game.id === updatedGame.id ? updatedGame : game))
      );
    },
    [games]
  );

  const markGameAsSavedIfRelevant = React.useCallback(
    async (gameId: string) => {
      console.log('markGameAsSavedIfRelevant', gameId, games, firebaseUser);
      if (!games || !firebaseUser) return;
      const currentOpenedGame = games && games.find(game => game.id === gameId);

      console.log('currentOpenedGame', currentOpenedGame);

      if (!currentOpenedGame || !currentOpenedGame.unsaved) return;

      try {
        const updatedGame = await updateGame(
          getAuthorizationHeader,
          firebaseUser.uid,
          currentOpenedGame.id,
          {
            unsaved: false,
          }
        );
        console.log('Game marked as saved:', updatedGame);
        onGameUpdated(updatedGame);
      } catch (error) {
        // Catch error, we'll try again later.
        console.error('Error while marking game as saved:', error);
      }
    },
    [games, onGameUpdated, firebaseUser, getAuthorizationHeader]
  );

  return {
    games,
    gamesFetchingError,
    fetchGames,
    onGameUpdated,
    markGameAsSavedIfRelevant,
  };
};

export default useGamesList;
