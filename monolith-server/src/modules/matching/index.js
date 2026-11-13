import ConnectionRequest from './connectionRequest.model.js';
import connectionRequestRepository, {
  ConnectionRequestRepository,
} from './matching.repository.js';
import {
  MatchingStrategyFactory,
  InterestedSwipeStrategy,
  IgnoredSwipeStrategy,
  AcceptedReviewStrategy,
  RejectedReviewStrategy,
} from './matching.strategy.js';
import matchingService, { MatchingService } from './matching.service.js';
import matchingController, {
  MatchingController,
} from './matching.controller.js';
import { requestRouter, userMatchingRouter } from './matching.routes.js';

export {
  ConnectionRequest,
  ConnectionRequestRepository,
  connectionRequestRepository,
  MatchingStrategyFactory,
  InterestedSwipeStrategy,
  IgnoredSwipeStrategy,
  AcceptedReviewStrategy,
  RejectedReviewStrategy,
  MatchingService,
  matchingService,
  MatchingController,
  matchingController,
  requestRouter,
  userMatchingRouter,
};
