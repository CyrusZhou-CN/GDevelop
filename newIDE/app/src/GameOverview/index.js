// @flow

import * as React from 'react';
import { Trans } from '@lingui/macro';
import Grid from '@material-ui/core/Grid';
import { type Game } from '../Utils/GDevelopServices/Game';
import { ColumnStackLayout } from '../UI/Layout';
import GameHeader from './GameHeader';
import DashboardWidget from './DashboardWidget';
import FlatButton from '../UI/FlatButton';
import ArrowRight from '../UI/CustomSvgIcons/ArrowRight';
import FeedbackWidget from './FeedbackWidget';
import {
  getLobbyConfiguration,
  listComments,
  listGameActiveLeaderboards,
  type Comment,
  type Leaderboard,
  type LobbyConfiguration,
} from '../Utils/GDevelopServices/Play';
import { getBuilds, type Build } from '../Utils/GDevelopServices/Build';
import {
  getGameMetricsFrom,
  type GameMetrics,
} from '../Utils/GDevelopServices/Analytics';
import AuthenticatedUserContext from '../Profile/AuthenticatedUserContext';
import Text from '../UI/Text';
import AnalyticsWidget from './AnalyticsWidget';
import ServicesWidget from './ServicesWidget';
import type { GameDetailsTab } from '../GameDashboard/GameDetails';
import { Column, Line } from '../UI/Grid';
import TextButton from '../UI/TextButton';
import ArrowLeft from '../UI/CustomSvgIcons/ArrowLeft';

type Props = {|
  game: Game,
  analyticsSource: 'profile' | 'homepage' | 'projectManager',
  currentView: GameDetailsTab,
  setCurrentView: GameDetailsTab => void,
  onBack: () => void,
|};

const GameOverview = ({ game, currentView, setCurrentView, onBack }: Props) => {
  const { getAuthorizationHeader, profile } = React.useContext(
    AuthenticatedUserContext
  );
  const [feedbacks, setFeedbacks] = React.useState<?Array<Comment>>(null);
  const [builds, setBuilds] = React.useState<?Array<Build>>(null);
  const [gameRollingMetrics, setGameMetrics] = React.useState<?(GameMetrics[])>(
    null
  );
  const [leaderboards, setLeaderboards] = React.useState<?Array<Leaderboard>>(
    null
  );
  const [
    lobbyConfiguration,
    setLobbyConfiguration,
  ] = React.useState<?LobbyConfiguration>(null);
  const oneWeekAgo = React.useRef<Date>(
    new Date(new Date().setHours(0, 0, 0, 0) - 7 * 24 * 3600 * 1000)
  );

  React.useEffect(
    () => {
      if (!profile) {
        setFeedbacks(null);
        setBuilds(null);
        return;
      }

      const fetchData = async () => {
        const [
          feedbacks,
          builds,
          gameRollingMetrics,
          lobbyConfiguration,
          leaderboards,
        ] = await Promise.all([
          listComments(getAuthorizationHeader, profile.id, {
            gameId: game.id,
            type: 'FEEDBACK',
          }),
          getBuilds(getAuthorizationHeader, profile.id, game.id),
          getGameMetricsFrom(
            getAuthorizationHeader,
            profile.id,
            game.id,
            oneWeekAgo.current.toISOString()
          ),
          getLobbyConfiguration(getAuthorizationHeader, profile.id, {
            gameId: game.id,
          }),
          listGameActiveLeaderboards(
            getAuthorizationHeader,
            profile.id,
            game.id
          ),
        ]);
        setFeedbacks(feedbacks);
        setBuilds(builds);
        setGameMetrics(gameRollingMetrics);
        setLobbyConfiguration(lobbyConfiguration);
        setLeaderboards(leaderboards);
      };

      fetchData();
    },
    [getAuthorizationHeader, profile, game.id]
  );

  const onClickBack = React.useCallback(
    () => {
      if (currentView === 'details') {
        onBack();
      } else {
        setCurrentView('details');
      }
    },
    [currentView, onBack, setCurrentView]
  );

  return (
    <Column noMargin>
      <Line>
        <TextButton
          onClick={onClickBack}
          icon={<ArrowLeft fontSize="small" />}
          label={
            currentView === 'details' ? (
              <Trans>Back</Trans>
            ) : (
              <Trans>Back to {game.gameName}</Trans>
            )
          }
        />
      </Line>
      <ColumnStackLayout noMargin>
        <GameHeader game={game} />
        <Grid container spacing={2}>
          <AnalyticsWidget
            onSeeAll={() => setCurrentView('analytics')}
            gameMetrics={gameRollingMetrics}
            game={game}
          />
          <FeedbackWidget
            onSeeAll={() => setCurrentView('feedback')}
            feedbacks={feedbacks}
            game={game}
          />
          <ServicesWidget
            onSeeAllLeaderboards={() => setCurrentView('leaderboards')}
            leaderboards={leaderboards}
            lobbyConfiguration={lobbyConfiguration}
          />
          <DashboardWidget
            gridSize={3}
            title={<Trans>Exports</Trans>}
            seeMoreButton={
              <FlatButton
                label={<Trans>See all</Trans>}
                rightIcon={<ArrowRight fontSize="small" />}
                onClick={() => setCurrentView('builds')}
                primary
              />
            }
            renderSubtitle={
              !builds
                ? null
                : () => (
                    <Text color="secondary" size="body-small" noMargin>
                      {builds.length <
                      // Hardcoded value in the back.
                      // TODO: replace with pagination.
                      100 ? (
                        <Trans>{builds.length} exports created</Trans>
                      ) : (
                        <Trans>100+ exports created</Trans>
                      )}
                    </Text>
                  )
            }
          />
        </Grid>
      </ColumnStackLayout>
    </Column>
  );
};

export default GameOverview;