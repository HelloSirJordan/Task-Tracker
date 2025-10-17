#! /usr/bin/env node
const readline = require('node:readline')
const fs = require('node:fs')

const { stdin: input, stdout: output } = require('node:process')
const { json } = require('node:stream/consumers')
const rl = readline.createInterface({ input, output })

let tasks = []
class Task {
  constructor () {
    this.id = 0
    this.description = ''
    this.status = 'to-do' //enum to-do, inprogress, done, canceled, incomplete
    this.completedAt = ''
    this.createdAt = new Date()
    this.updatedAt = ''
  }

  updateStatus (status) {
    switch (status) {
      case 'to-do':
        this.status = 'to-do'
        break
      case 'in-progress':
        this.status = 'in-progress'
        break
      case 'done':
        this.status = 'done'
        break
      case 'canceled':
        this.status = 'canceled'
        break
      case 'incomplete':
        this.status = 'incomplete'
        break
      default:
        console.error(
          `${status} is not a valid status. use -h for more details`
        )
        throw error
    }
    this.updatedAt = new Date()

    if (status === 'done') {
      this.completedAt = new Date()
    } else {
      this.completedAt = ''
    }
  }
}

rl.question('Wellcome to tasker! What would you like to do:\n', input => {
  if (input.match(/(-h)/i)) {
    console.log('help...')
    rl.close()
  } else if (input.match(/^c(reate)/gi)) {
    console.log('Create...')
    rl.close()
  } else if (input.match(/^a(dd)/i)) {
    let task = new Task()
    task.description = input.replace(/^a(dd)/, '').trim()
    fs.readFile('./tasks.json', 'utf8', (err, jsonString) => {
      if (err) {
        if (err.code === 'ENOENT') {
          task.id++

          tasks.push(task)
          fs.writeFileSync(
            './tasks.json',
            JSON.stringify(tasks, null, 2),
            err => {
              if (err) {
                console.error(err)
              }
            }
          )
          console.log(`Task added successfully (ID: ${task.id})`)
        } else {
          console.log('Unknown error')
        }
      } else {
        let data = JSON.parse(jsonString)

        task.id = data.length + 1

        data.push(task)

        fs.writeFile('./tasks.json', JSON.stringify(data, null, 2), err => {
          if (err) {
            console.error(err)
          }
        })
        console.log(`Task added successfully (ID: ${task.id})`)
      }
    })

    rl.close()
  } else if (input.match(/^l(ist)/i)) {
    let prompt = input.replace(/^l(ist)/, '').trim()
    let data
    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      try {
        data = JSON.parse(jsonString)
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
        data.forEach(element => {
          switch (element.status) {
            case 'to-do':
              console.log(element.description)
              break
            case 'in-progress':
              console.log(element.description)
              break
            case 'done':
              console.log(element.description)
              break
            case 'canceled':
              console.log(element.description)
              break
            case 'incomplete':
              console.log(element.description)
              break
          }
        })
      } else if (prompt.match(/^t(o-do)/)) {
        data.forEach(element => {
          if (element.status === 'to-do') {
            console.log(element.description)
          }
        })
      } else if (prompt.match(/^i(n-progress)/)) {
        data.forEach(element => {
          if (element.status === 'in-progress') {
            console.log(element.description)
          }
        })
      } else if (prompt.match(/^d(one)/)) {
        data.forEach(element => {
          if (element.status === 'done') {
            console.log(element.description)
          }
        })
      } else if (prompt.match(/^c(anceled)/)) {
        data.forEach(element => {
          if (element.status === 'canceled') {
            console.log(element.description)
          }
        })
      } else if (prompt.match(/^i(ncomplete)/)) {
        data.forEach(element => {
          if (element.status === 'incomplete') {
            console.log(element.description)
          }
        })
      } else if (prompt.match(/^r(atio)/)) {
        let allTasks = data.length
        let completedTasks = 0
        data.forEach(element => {
          if (element.status === 'done') {
            completedTasks++
          }
        })
        console.log(`${completedTasks}/${allTasks}`)
      } else if (prompt.match(/^l(ast-24)/)) {
        let completedinlast24 = 0
        const last24 = new Date(-24 * 3600 * 1000)

        data.forEach(element => {
          if (element.completedAt) {
            const completedAt = new Date(element.completedAt)
            if (completedAt > last24) {
              completedinlast24++
            }
          }
        })
        console.log(`Completed in last 24 hours: ${completedinlast24}`)
      } else {
        data.forEach(element => {
          console.error(element.description)
        })
      }
    })
  } else if (input.match(/^u(pdate)/i)) {
    let prompt = input.replace(/^u(pdate)/, '').trim()
    let tasks
    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.error('No file')
        } else {
          console.error(err)
        }
      }
      try {
        tasks = JSON.parse(jsonString)
        //data.task.updatedAt = new Date()
      } catch (error) {
        console.error(error)
      }

      let id = prompt.match(/^[0-9]+/g)[0]

      let obj = tasks.find(obj => obj.id == id)

      if (obj === undefined) {
        console.error(`Task with id (${id}) does not exist`)
        rl.close()
      } else {
        prompt = prompt.replace(/^[0-9]+/, '').trim()

        let task = new Task()
        task.id = obj.id
        task.description = prompt
        task.status = obj.status
        task.completedAt = obj.completedAt
        task.createdAt = obj.createdAt
        task.updatedAt = new Date()

        tasks[id - 1] = task

        fs.writeFile('./tasks.json', JSON.stringify(tasks, null, 2), err => {
          if (err) {
            console.error(err)
          }
          console.log(`Task updated successfully (ID: ${id})`)
          rl.close()
        })
      }
    })
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
        tasks = JSON.parse(jsonString)
        //data.task.updatedAt = new Date()
      } catch (error) {
        console.error(error)
      }
      let prompt = input.replace(/^m(ark)/, '').trim()
      let id = prompt.match(/^[0-9]+/g)[0]
      let status = prompt.replace(/^[0-9]+/, '').trim()

      let obj = tasks.find(obj => obj.id == id)

      if (obj === undefined) {
        console.error(`Task with id (${id}) does not exist`)
        rl.close()
      } else {
        let task = new Task()

        try {
          task.updateStatus(status)
        } catch (error) {
          rl.close()
          return
        }
        console.log('next')

        task.id = obj.id
        task.description = obj.description
        task.completedAt = obj.completedAt
        task.createdAt = obj.createdAt
        task.updateStatus(status)

        console.log(task)
        tasks[id - 1] = task

        fs.writeFile('./tasks.json', JSON.stringify(tasks, null, 2), err => {
          if (err) {
            console.error(err)
          }
          console.log(`Task updated successfully (ID: ${id})`)
          rl.close()
        })
      }
    })
  } else {
    console.error('Invalid command')
    rl.close()
  }
})
