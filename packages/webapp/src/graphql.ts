import { gql } from '@apollo/client';

export const GetCompetitionsQuery = gql`
  query GetCompetitions {
    currentUser {
      id
      competitions {
        id
        name
        startDate
        endDate
        country
      }
    }
  }
`;

export const ImportCompetitionMutation = gql`
  mutation ImportCompetition($competitionId: String!) {
    importCompetition(competitionId: $competitionId) {
      id
      name
    }
  }
`;

export const ActivitiesQuery = gql`
  query Activities($competitionId: String!) {
    activities(competitionId: $competitionId) {
      activityId
      startTime
      endTime
    }
  }
`;

export const StartActivityMutation = gql`
  mutation StartActivity($competitionId: String!, $activityId: Int!) {
    startActivity(competitionId: $competitionId, activityId: $activityId) {
      activityId
      startTime
      endTime
    }
  }
`;

export const StopActivityMutation = gql`
  mutation StopActivity($competitionId: String!, $activityId: Int!) {
    stopActivity(competitionId: $competitionId, activityId: $activityId) {
      activityId
      startTime
      endTime
    }
  }
`;

export const StopStartActivityMutation = gql`
  mutation StopStartActivity(
    $competitionId: String!
    $stopActivityId: Int!
    $startActivityId: Int!
  ) {
    stop: stopActivity(
      competitionId: $competitionId
      activityId: $stopActivityId
    ) {
      activityId
      startTime
      endTime
    }
    start: startActivity(
      competitionId: $competitionId
      activityId: $startActivityId
    ) {
      activityId
      startTime
      endTime
    }
  }
`;
