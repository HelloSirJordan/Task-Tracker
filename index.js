#! /usr/bin/env node
const readline = require('node:readline')
const fs = require('node:fs')

const { stdin: input, stdout: output } = require('node:process')
const { json } = require('node:stream/consumers')
const rl = readline.createInterface({ input, output })

class Tasks {
  constructor () {
    this.tasks = []
  }

  readFile () {
    fs.readFile('./tasks.json', 'utf8', (err, jsonString) => {
      if (err) {
        if (err) return
        else {
          return (data = JSON.parse(jsonString))
        }
      }
    })
  }

  writeFile () {
    fs.writeFileSync('./tasks.json', JSON.stringify(tasksArr, null, 2), err => {
      if (err) {
        console.error(err)
      }
    })
  }

  addTask (description) {
    let task = new Task(this.getNewID(), description)
    this.tasks.push(task)
    console.log(`Task added successfully (ID: ${task.id})`)
    this.writeFile()
  }

  addTasks (tasks) {
    this.tasks.push(...tasks)
  }

  listByStatus (status) {
    let newArr = []
    this.tasks.forEach(task => {
      if (task.status === status) {
        newArr.push(task)
      }
    })
    console.log(`${status}: ${newArr.length}`)
    newArr.forEach(task => {
      console.log(task.description)
    })
  }

  listAll () {
    this.listByStatus('to-do')
    this.listByStatus('in-progress')
    this.listByStatus('done')
    this.listByStatus('canceled')
    this.listByStatus('incomplete')
  }

  UpdateTask (id, description) {
    const arrIndex = this.tasks.findIndex(task => task.id == id)

    if (arrIndex !== -1) {
      this.tasks[arrIndex].description = description
      this.tasks[arrIndex].updatedAt = new Date()
      this.writeFile()
      console.log(`Task updated successfully (ID: ${id})`)
      return
    } else {
      console.error(`Task with id (${id}) does not exist`)
      return
    }
  }

  updateStatus (id, status) {
    let arrIndex = this.tasks.findIndex(task => task.id == id)
    if (arrIndex !== -1) {
      switch (status) {
        case 'to-do':
          this.tasks[arrIndex].status = 'to-do'
          break
        case 'in-progress':
          this.tasks[arrIndex].status = 'in-progress'
          break
        case 'done':
          this.tasks[arrIndex].status = 'done'
          break
        case 'canceled':
          this.tasks[arrIndex].status = 'canceled'
          break
        case 'incomplete':
          this.tasks[arrIndex].status = 'incomplete'
          break
        default:
          console.error(
            `${status} is not a valid status. use -h for more details`
          )
          return
      }
      this.tasks[arrIndex].updatedAt = new Date()

      if (status === 'done') {
        this.tasks[arrIndex].completedAt = new Date()
      } else {
        this.tasks[arrIndex].completedAt = ''
      }
      this.writeFile()
      console.log(`Task status updated successfully (ID: ${id})`)
    } else {
      console.error(`Task with id (${id}) does not exist`)
    }
  }

  deleteTask (id) {
    let arrIndex = this.tasks.findIndex(task => task.id == id)

    if (arrIndex !== -1) {
      let deletedTask = this.tasks.splice(arrIndex, 1)
      this.writeFile()
      console.log(`Task Deleted successfully (ID: ${id})`)
    } else {
      console.error(`Task with id (${id}) does not exist`)
    }
  }
  // Helper for updating (description and statys) and deleting tasks
  findTask (id) {
    let task = this.tasks.find(task => task.id == id)
    if (task !== undefined) {
      return task
    } else {
      console.error(`Task with id (${id}) does not exist`)
      throw error
    }
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
    const last24 = new Date(-24 * 3600 * 1000)
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
}

class Task {
  constructor (id, description) {
    // Make ID getNewID function from Tasks class
    this.id = id
    this.description = description
    this.status = 'to-do' //enum to-do, inprogress, done, canceled, incomplete
    this.completedAt = ''
    this.createdAt = new Date()
    this.updatedAt = ''
  }
}

let tasksArr = new Tasks()

rl.question('Wellcome to tasker! What would you like to do:\n', input => {
  if (input.match(/(-h)/i)) {
    console.log('help...')
    rl.close()
  } else if (input.match(/^a(dd)/i)) {
    const prompt = input.replace(/^a(dd)/, '').trim()

    fs.readFile('./tasks.json', 'utf8', (err, jsonString) => {
      if (err) {
        if (err.code === 'ENOENT') {
          tasksArr.addTask(prompt)
        } else {
          console.log('Unknown error')
        }
      } else {
        let data = JSON.parse(jsonString)
        tasksArr.addTasks(data.tasks)
        tasksArr.addTask(prompt)
      }
    })

    rl.close()
  } else if (input.match(/^l(ist)/i)) {
    let prompt = input.replace(/^l(ist)/, '').trim()

    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      try {
        const data = JSON.parse(jsonString)
        tasksArr.addTasks(data.tasks)
      } catch (error) {
        console.error(error)
      }
      if (err) {
        if (err.code === 'ENOENT') {
          console.log('Tasks: 0')
        } else {
          console.error(err)
        }
      } else if (prompt.length == 0) {
        tasksArr.listAll()
      } else if (prompt.match(/^t(o-do)/)) {
        tasksArr.listByStatus('to-do')
      } else if (prompt.match(/^i(n-progress)/)) {
        tasksArr.listByStatus('in-progress')
      } else if (prompt.match(/^d(one)/)) {
        tasksArr.listByStatus('done')
      } else if (prompt.match(/^c(anceled)/)) {
        tasksArr.listByStatus('canceled')
      } else if (prompt.match(/^i(ncomplete)/)) {
        tasksArr.listByStatus('incomplete')
      } else if (prompt.match(/^r(atio)/)) {
        const raito = tasksArr.getRatio()
        console.log(raito)
      } else if (prompt.match(/^l(ast-24)/)) {
        const last24 = tasksArr.getLast24()
        console.log(last24)
      } else {
        console.error('Unknown list command, try list or list [status] ')
      }
    })
    rl.close()
  } else if (input.match(/^u(pdate)/i)) {
    let prompt = input.replace(/^u(pdate)/, '').trim()

    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.error('No file')
        } else {
          console.error(err)
        }
      }
      try {
        const data = JSON.parse(jsonString)
        console.log('data: ', data)

        tasksArr.addTasks(data.tasks)
      } catch (error) {
        console.error(error)
      }

      let id = prompt.match(/^[0-9]+/g)[0]
      console.log(`User ID: ${id}`)

      prompt = prompt.replace(/^[0-9]+/, '').trim()

      tasksArr.UpdateTask(id, prompt)
    })
    rl.close()
  } else if (input.match(/^m(ark)/i)) {
    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.error('No file')
        } else {
          console.error(err)
          return
        }
      }
      try {
        data = JSON.parse(jsonString)
        tasksArr.addTasks(data.tasks)
      } catch (error) {
        console.error(error)
      }
      let prompt = input.replace(/^m(ark)/, '').trim()
      let id = prompt.match(/^[0-9]+/g)[0]
      let status = prompt.replace(/^[0-9]+/, '').trim()

      tasksArr.updateStatus(id, status)
    })
    rl.close()
  } else if (input.match(/^d(elete)/i)) {
    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.error('No file')
        } else {
          console.error(err)
          return
        }
      }
      try {
        data = JSON.parse(jsonString)
        tasksArr.addTasks(data.tasks)
      } catch (error) {
        console.error(error)
        return
      }
      let prompt = input.replace(/^d(elete)/, '').trim()
      let id = Number(prompt.match(/^[0-9]+/g)[0])

      tasksArr.deleteTask(id)
    })
    rl.close()
  } else {
    console.error('Invalid command')
    rl.close()
  }
})
