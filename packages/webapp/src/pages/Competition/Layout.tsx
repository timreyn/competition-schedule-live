import { useQuery } from '@apollo/client';
import { LinearProgress } from '@mui/material';
import { useQuery as useReactQuery } from '@tanstack/react-query';
import { Competition } from '@wca/helpers';
import { createContext, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Activity } from '../../generated/graphql';
import { ActivitiesQuery, ActivitiesSubscription } from '../../graphql';
import { useAuth } from '../../providers/AuthProvider';
import { StoreContext } from '../../providers/BasicStoreProvider';

interface IWCIFContext {
  wcif?: Competition;
  loading?: boolean;
  activities?: Activity[];
  ongoingActivities?: Array<Activity & { startTime: string }>;
  activitiesLoading?: boolean;
}

const WCIFContext = createContext<IWCIFContext>({});

function CompetitionLayout() {
  const navigate = useNavigate();
  const { wcaApiFetch } = useAuth();
  const [_, setAppTitle] = useContext(StoreContext).appTitle;
  const { competitionId } = useParams<{ competitionId: string }>();
  const { isLoading, data: wcif } = useReactQuery<Competition>({
    queryKey: ['public'],
    queryFn: () =>
      wcaApiFetch(`/api/v0/competitions/${competitionId || ''}/wcif/public`),
  });

  useEffect(() => {
    if (wcif && wcif?.id !== competitionId) {
      navigate(`/competitions/${wcif?.id}`, { replace: true });
    }
  }, [competitionId, wcif]);

  const {
    data: currentActivities,
    subscribeToMore,
    loading: activitiesLoading,
  } = useQuery<{
    activities: Activity[];
  }>(ActivitiesQuery, {
    variables: { competitionId: wcif?.id },
  });

  useEffect(() => {
    if (!wcif?.id) {
      return;
    }

    const unsub = subscribeToMore<{ activity: Activity }>({
      document: ActivitiesSubscription,
      variables: { competitionId: wcif?.id },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData?.data?.activity) {
          return prev;
        }

        const newActivity = subscriptionData.data.activity;

        return {
          ...prev,
          activities: [
            ...prev.activities.filter(
              (a) => a.activityId !== newActivity.activityId
            ),
            newActivity,
          ],
        };
      },
    });

    return () => unsub();
  }, [wcif]);

  useEffect(() => {
    setAppTitle(wcif?.name || 'Competition Schedule Live');
  }, [wcif?.name]);

  const ongoingActivities = currentActivities?.activities?.filter(
    (activity) => activity.startTime && !activity.endTime
  ) as Array<Activity & { startTime: string }>;

  return (
    <WCIFContext.Provider
      value={{
        loading: isLoading,
        wcif,
        activities: currentActivities?.activities,
        ongoingActivities,
        activitiesLoading,
      }}>
      {isLoading ? <LinearProgress /> : null}
      <Outlet />
    </WCIFContext.Provider>
  );
}

export const useCompetition = () => useContext(WCIFContext);

export default CompetitionLayout;
