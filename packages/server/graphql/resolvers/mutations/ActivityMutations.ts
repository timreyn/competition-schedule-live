import { AppContext } from '../../../server';
import { MutationResolvers } from '../../../generated/graphql';
import {
  createNotificationsForActivity,
  sendWebhooksForCompetition,
} from '../../../controllers/webhooks';

export const startActivity: MutationResolvers<AppContext>['startActivity'] =
  async (_, { competitionId, activityId }, { db, user, pubsub }) => {
    if (!user) {
      throw new Error('Not Authenticated');
    }

    const compAccess = await db.competitionAccess.findFirst({
      where: {
        competitionId: {
          equals: competitionId,
          mode: 'insensitive',
        },
        userId: user.id,
      },
    });

    if (!compAccess) {
      throw new Error('Not Authorized');
    }

    const activity = await db.activityHistory.upsert({
      where: {
        competitionId_activityId: {
          competitionId,
          activityId,
        },
      },
      update: {
        startTime: new Date(),
        endTime: null,
      },
      create: {
        competitionId,
        activityId,
        startTime: new Date(),
        endTime: null,
      },
    });

    // TODO: Expose room somehow
    await pubsub.publish('ACTIVITY_UPDATED', { activityUpdated: activity });

    void sendWebhooksForCompetition(
      competitionId,
      await createNotificationsForActivity(competitionId, activityId)
    ).then((res) => {
      console.log(
        {
          competitionId,
          activityId,
        },
        'Pinged',
        res.filter((r) => r.status === 'fulfilled').length,
        'webhooks'
      );
    });

    return activity;
  };

export const stopActivity: MutationResolvers<AppContext>['stopActivity'] =
  async (_, { competitionId, activityId }, { db, user, pubsub }) => {
    if (!user) {
      throw new Error('Not Authenticated');
    }

    const compAccess = await db.competitionAccess.findFirst({
      where: {
        competitionId: {
          equals: competitionId,
          mode: 'insensitive',
        },
        userId: user.id,
      },
    });

    if (!compAccess) {
      throw new Error('Not Authorized');
    }

    const activity = await db.activityHistory.update({
      where: {
        competitionId_activityId: {
          competitionId,
          activityId,
        },
      },
      data: {
        endTime: new Date(),
      },
    });

    await pubsub.publish('ACTIVITY_UPDATED', { activityUpdated: activity });

    return activity;
  };

export const resetActivities: MutationResolvers<AppContext>['resetActivities'] =
  async (_, { competitionId }, { db, user, pubsub }) => {
    if (!user) {
      throw new Error('Not Authenticated');
    }

    // Work for me but not for thee
    if (user.id !== 8184) {
      const compAccess = await db.competitionAccess.findFirst({
        where: {
          competitionId,
          userId: user.id,
        },
      });

      if (!compAccess) {
        throw new Error('Not Authorized');
      }
    }

    await db.activityHistory.updateMany({
      where: {
        competitionId,
      },
      data: {
        startTime: null,
        endTime: null,
      },
    });

    const findActivities = await db.activityHistory.findMany({
      where: {
        competitionId,
      },
    });

    console.log(findActivities);

    await Promise.all(
      findActivities.map(
        async (activity) =>
          await pubsub.publish('ACTIVITY_UPDATED', {
            activityUpdated: activity,
          })
      )
    );

    return findActivities;
  };
