import BaseRepository from '../../core/baseRepository.js';
import ConnectionRequest from './connectionRequest.model.js';

export class ConnectionRequestRepository extends BaseRepository {
  constructor(model = ConnectionRequest) {
    super(model);
  }

  async findExistingRequest(userId1, userId2) {
    return this.model.findOne({
      $or: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 },
      ],
    });
  }

  async create(data) {
    const request = new this.model(data);
    return request.save();
  }

  async findByIdAndToUserIdAndStatus(id, toUserId, status) {
    return this.model.findOne({ _id: id, toUserId, status });
  }

  async findReceivedRequests(toUserId, status) {
    return this.model.find({ toUserId, status });
  }

  async findConnections(userId) {
    return this.model.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      status: 'accepted',
    });
  }

  async findConnectionBetween(userId1, userId2) {
    return this.model.findOne({
      $or: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 },
      ],
      status: 'accepted',
    });
  }

  async findAllRequestsForUser(userId) {
    return this.model.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    });
  }
}

export const connectionRequestRepository = new ConnectionRequestRepository();
export default connectionRequestRepository;
