const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const Task = require('./task')
const { STATUS } = require('./constants')

function resolveDataFile () {
  if (process.env.TASKER_DATA_FILE) return process.env.TASKER_DATA_FILE

  const dataDir = (() => {
    if (process.platform === 'win32') {
      return path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'tasker'
      )
    }

    if (process.env.XDG_DATA_HOME) {
      return path.join(process.env.XDG_DATA_HOME, 'tasker')
    }

    return path.join(os.homedir(), '.local', 'share', 'tasker')
  })()

  return path.join(dataDir, 'tasks.json')
}

class TaskStore {
  constructor (filePath = resolveDataFile()) {
    this.filePath = filePath
    this.tasks = []
    this.initialized = false
  }

  async init () {
    if (this.initialized) return
    await this.#ensureStorage()
    await this.#readFile()
    this.initialized = true
  }

  async addTask (description) {
    this.#ensureInitialized()
    const text = this.#validateDescription(description)
    const id = this.#getNextId()
    const task = new Task(id, text)
    this.tasks.push(task)
    await this.#writeFile()
    return task
  }

  async updateTask (id, description) {
    this.#ensureInitialized()
    const numericId = this.#validateId(id)
    const text = this.#validateDescription(description)
    const task = this.#getTaskById(numericId)
    task.description = text
    task.updatedAt = new Date().toISOString()
    await this.#writeFile()
    return task
  }

  async updateStatus (id, status) {
    this.#ensureInitialized()
    const numericId = this.#validateId(id)
    const normalizedStatus = this.#normalizeStatus(status)
    const task = this.#getTaskById(numericId)

    if (task.status === normalizedStatus) {
      throw new Error(`Status is already ${normalizedStatus}`)
    }

    task.status = normalizedStatus
    task.updatedAt = new Date().toISOString()
    task.completedAt = normalizedStatus === STATUS.DONE ? task.updatedAt : null

    await this.#writeFile()
    return task
  }

  async deleteTask (id) {
    this.#ensureInitialized()
    const numericId = this.#validateId(id)
    const idx = this.tasks.findIndex(task => task.id === numericId)
    if (idx < 0) throw new Error(`Task with ID (${numericId}) does not exist`)
    const [deleted] = this.tasks.splice(idx, 1)
    await this.#writeFile()
    return deleted
  }

  getTasksByStatus (status) {
    this.#ensureInitialized()
    const normalizedStatus = this.#normalizeStatus(status)
    return this.tasks.filter(task => task.status === normalizedStatus)
  }

  getAllTasks () {
    this.#ensureInitialized()
    return [...this.tasks]
  }

  getRatio () {
    this.#ensureInitialized()
    const total = this.tasks.length
    const completed = this.tasks.filter(task => task.status === STATUS.DONE).length
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { completed, total, percent }
  }

  getCompletedLast24Hours () {
    this.#ensureInitialized()
    const last24 = Date.now() - 24 * 3600 * 1000
    return this.tasks.filter(task => {
      if (!task.completedAt) return false
      return new Date(task.completedAt).getTime() >= last24
    }).length
  }

  // private helpers
  async #ensureStorage () {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    try {
      await fs.access(this.filePath)
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(this.filePath, JSON.stringify({ tasks: [] }, null, 2))
      } else {
        throw error
      }
    }
  }

  async #readFile () {
    try {
      const jsonString = await fs.readFile(this.filePath, 'utf8')
      const payload = JSON.parse(jsonString)
      this.tasks = Array.isArray(payload.tasks) ? payload.tasks : []
    } catch (error) {
      throw new Error(`Unable to read tasks file: ${error.message}`)
    }
  }

  async #writeFile () {
    try {
      await fs.writeFile(
        this.filePath,
        JSON.stringify({ tasks: this.tasks }, null, 2)
      )
    } catch (error) {
      throw new Error(`Unable to save tasks file: ${error.message}`)
    }
  }

  #getNextId () {
    if (this.tasks.length === 0) return 1
    return Math.max(...this.tasks.map(task => task.id)) + 1
  }

  #getTaskById (id) {
    const task = this.tasks.find(task => task.id === id)
    if (!task) throw new Error(`Task with ID (${id}) does not exist`)
    return task
  }

  #normalizeStatus (status) {
    if (!status) throw new Error('Status is required')
    const normalized = status.toLowerCase()
    const validStatuses = Object.values(STATUS)
    if (!validStatuses.includes(normalized)) {
      throw new Error(`${status} is not a valid status. Use --help to see options.`)
    }
    return normalized
  }

  #validateDescription (description) {
    if (!description || !description.trim()) {
      throw new Error('Description cannot be empty')
    }
    return description.trim()
  }

  #validateId (id) {
    const numeric = Number(id)
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new Error('Invalid task ID')
    }
    return numeric
  }

  #ensureInitialized () {
    if (!this.initialized) {
      throw new Error('Task store not initialized. Call init() first.')
    }
  }
}

module.exports = TaskStore
module.exports.resolveDataFile = resolveDataFile
