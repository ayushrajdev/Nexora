const ConnectionRequest = require('../models/connectionRequest');

class ConnectionRequestRepository {
  async findExistingRequest(userId1, userId2) {
    return ConnectionRequest.findOne({
      $or: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 }
      ]
    });
  }

  async create(data) {
    const request = new ConnectionRequest(data);
    return request.save();
  }

  async findByIdAndToUserIdAndStatus(id, toUserId, status) {
    return ConnectionRequest.findOne({ _id: id, toUserId, status });
  }

  async findReceivedRequests(toUserId, status) {
    return ConnectionRequest.find({ toUserId, status });
  }

  async findConnections(userId) {
    return ConnectionRequest.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      status: 'accepted'
    });
  }

  async findConnectionBetween(userId1, userId2) {
    return ConnectionRequest.findOne({
      $or: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 }
      ],
      status: 'accepted'
    });
  }

  async findAllRequestsForUser(userId) {
    return ConnectionRequest.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    });
  }
}

module.exports = new ConnectionRequestRepository();
