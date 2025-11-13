const { STATUS } = require('./constants')

class Task {
  constructor (id, description) {
    this.id = id
    this.description = description
    this.status = STATUS.TODO
    this.completedAt = null
    this.createdAt = new Date().toISOString()
    this.updatedAt = null
  }
}

module.exports = Task
