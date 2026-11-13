/**
 * BaseRepository — Generic Repository Pattern base class.
 * Encapsulates common Mongoose CRUD operations so domain repositories
 * stay DRY, reusable, and easily mockable in unit/integration tests.
 */
export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findOne(filter) {
    return this.model.findOne(filter);
  }

  async find(filter) {
    return this.model.find(filter);
  }

  async create(data) {
    return this.model.create(data);
  }

  async updateById(id, updates, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, updates, options);
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
}

export default BaseRepository;
