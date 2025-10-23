#! /usr/bin/env node
const readline = require('node:readline')
const fs = require('node:fs').promises

const { stdin: input, stdout: output } = require('node:process')

const rl = readline.createInterface({ input, output, prompt: 'tasker> ' })

class Tasks {
  constructor () {
    this.tasks = []
  }

  async readFile () {
    try {
      const jsonString = await fs.readFile('./tasks.json', 'utf8')

      this.tasks = JSON.parse(jsonString).tasks || []
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(err)
    }
  }

  async writeFile () {
    try {
      await fs.writeFile(
        './tasks.json',
        JSON.stringify({ tasks: this.tasks }, null, 2)
      )
    } catch (error) {
      console.error(error)
      return
    }
  }

  async addTask (description) {
    try {
      this.validateDescription(description)
      let task = new Task(this.getNewID(), description)
      this.tasks.push(task)
      await this.writeFile()
      console.log(`Task added successfully (ID: ${task.id})`)
    } catch (error) {
      console.error(error.message)
    }
  }

  listByStatus (status) {
    const filtered = this.tasks.filter(task => task.status === status)

    console.log(`${status}: ${filtered.length}`)

    filtered.forEach(task => {
      console.log(`${task.description} (ID: ${task.id})`)
    })
  }

  listAll () {
    this.listByStatus(STATUS.TODO)
    this.listByStatus(STATUS.IN_PROGRESS)
    this.listByStatus(STATUS.DONE)
    this.listByStatus(STATUS.CANCELED)
    this.listByStatus(STATUS.INCOMPLETE)
  }

  async updateTask (id, description) {
    try {
      this.validateID(id)
      this.validateDescription(description)
      const arrIndex = this.tasks.findIndex(task => task.id == id)

      if (arrIndex !== -1) {
        this.tasks[arrIndex].description = description
        this.tasks[arrIndex].updatedAt = new Date()
        await this.writeFile()
        console.log(`Task updated successfully (ID: ${id})`)
      } else throw new Error(`Task with ID (${id}) does not exist`)
    } catch (error) {
      console.error(error.message)
    }
  }

  async updateStatus (id, status) {
    try {
      this.validateID(id)
      const arrIndex = this.tasks.findIndex(task => task.id == id)

      const validStatuses = Object.values(STATUS)
      if (!validStatuses.includes(status))
        throw new Error(`${status} is not a valid status. Use -h for help.`)
      if (this.tasks[arrIndex].status === status)
        throw new Error(`Status is already ${status}`)
      this.tasks[arrIndex].status = status
      this.tasks[arrIndex].updatedAt = new Date()

      this.tasks[arrIndex].completedAt =
        status === STATUS.DONE ? new Date() : ''

      await this.writeFile()
      console.log(`Task status updated successfully (ID: ${id})`)
    } catch (error) {
      console.error(error.message)
    }
  }

  async deleteTask (id) {
    try {
      this.validateID(id)
      let arrIndex = this.tasks.findIndex(task => task.id == id)

      if (arrIndex !== -1) {
        this.tasks.splice(arrIndex, 1)

        await this.writeFile()
        console.log(`Task Deleted successfully (ID: ${id})`)
      } else {
        console.error(`Task with ID (${id}) does not exist`)
      }
    } catch (error) {
      console.error(error.message)
    }
  }
  // Helper for updating (description and status) and deleting tasks
  findTask (id) {
    let task = this.tasks.find(task => task.id == id)
    if (task !== undefined) {
      return task
    } else throw new Error(`Task with ID (${id}) does not exist`)
  }
  // Helper for adding tasks
  getNewID () {
    let newID = 0
    const ids = this.tasks.map(task => task.id)
    if (ids.length > 0) {
      newID = Math.max(...ids) + 1
    } else {
      newID = 1
    }

    return newID
  }
  // Helper for listing ratio
  getRatio () {
    const allTasks = this.tasks.length

    let completedTasks = 0
    let ratio
    this.tasks.forEach(task => {
      if (task.status === 'done') {
        completedTasks++
      }
    })
    ratio = `${completedTasks}/${allTasks}`

    return ratio
  }
  // Helper for listing completed in last 24 hours
  getLast24 () {
    const last24 = new Date(Date.now() - 24 * 3600 * 1000)

    let completedinlast24 = 0

    this.tasks.forEach(element => {
      if (element.completedAt) {
        const completedAt = new Date(element.completedAt)
        if (completedAt > last24) {
          completedinlast24++
        }
      }
    })
    return completedinlast24
  }

  validateDescription (desc) {
    if (!desc || !desc.trim()) throw new Error('Description cannot be empty')
  }

  validateID (id) {
    if (!id || isNaN(id)) throw new Error('Invalid task ID')
  }
}

const STATUS = {
  TODO: 'to-do',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete'
}

class Task {
  constructor (id, description) {
    // Make ID getNewID function from Tasks class
    this.id = id
    this.description = description
    this.status = STATUS.TODO
    this.completedAt = ''
    this.createdAt = new Date()
    this.updatedAt = ''
  }
}

const args = process.argv.slice(2)

let tasksArr = new Tasks()

async function main () {
  await tasksArr.readFile()
  const command = args.join(' ')

  if (/-h|--help/i.test(command)) {
    console.log(`
Tasker
===============

A simple command-line app to manage your tasks efficiently.

Commands
--------
add <description>     Create a new task with the given description
list [option]         Display tasks (use options below to filter)
update <id> <desc>    Change the description of task with given ID  
mark <id> <status>    Update the status of task with given ID
delete <id>           Remove task with given ID

List Options
------------
to-do                 Show only tasks marked as to-do
in-progress           Show only tasks in progress
done                  Show only completed tasks
canceled              Show only canceled tasks
incomplete            Show only incomplete tasks
ratio                 Display ratio of completed to total tasks
last-24               Show tasks completed in last 24 hours

Status Values
------------
to-do                 Task not yet started
in-progress           Task currently being worked on
done                  Task completed successfully
canceled              Task canceled or abandoned
incomplete            Task not completed by deadline

Examples
--------
tasker add "Complete project proposal"
tasker list done
tasker update 1 "Meeting at 3pm instead of 2pm"
tasker mark 1 in-progress
tasker delete 1

Help
----
-h, --help            Show this help message
`)

    rl.close()
  } else if (command.match(/^a(dd)/i)) {
    const prompt = command.replace(/^a(dd)/, '').trim()

    tasksArr.addTask(prompt)

    rl.close()
  } else if (command.match(/^l(ist)/i)) {
    let prompt = command.replace(/^l(ist)/, '').trim()

    if (prompt.length == 0) {
      tasksArr.listAll()
    } else if (prompt.match(/^t(o-do)/)) {
      tasksArr.listByStatus(STATUS.TODO)
    } else if (prompt.match(/^i(n-progress)/)) {
      tasksArr.listByStatus(STATUS.IN_PROGRESS)
    } else if (prompt.match(/^d(one)/)) {
      tasksArr.listByStatus(STATUS.DONE)
    } else if (prompt.match(/^c(anceled)/)) {
      tasksArr.listByStatus(STATUS.CANCELED)
    } else if (prompt.match(/^i(ncomplete)/)) {
      tasksArr.listByStatus(STATUS.INCOMPLETE)
    } else if (prompt.match(/^r(atio)/)) {
      const ratio = tasksArr.getRatio()
      console.log(ratio)
    } else if (prompt.match(/^l(ast-24)/)) {
      const last24 = tasksArr.getLast24()
      console.log(last24)
    } else {
      console.error('Invalid list option. Use -h for help')
    }

    rl.close()
  } else if (command.match(/^u(pdate)/i)) {
    let prompt = command.replace(/^u(pdate)/, '').trim()

    let id = prompt.match(/^[0-9]+/g)

    prompt = prompt.replace(/^[0-9]+/, '').trim()

    tasksArr.updateTask(id, prompt)

    rl.close()
  } else if (command.match(/^m(ark)/i)) {
    let prompt = command.replace(/^m(ark)/, '').trim()
    let id = prompt.match(/^[0-9]+/g)
    let status = prompt.replace(/^[0-9]+/, '').trim()

    tasksArr.updateStatus(id, status)

    rl.close()
  } else if (command.match(/^d(elete)/i)) {
    let prompt = command.replace(/^d(elete)/, '').trim()
    let id = prompt.match(/^[0-9]+/g)

    tasksArr.deleteTask(id)

    rl.close()
  } else {
    console.error('Invalid command. Use -h for help')
    rl.close()
  }
}

main()
