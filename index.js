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
    this.status = status
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
    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      if (err) {
        console.error(err)
      }
      try {
        const data = JSON.parse(jsonString)
        console.log(data)
      } catch (error) {
        console.error(error)
      }
    })
  } else if (input.match(/^u(pdate)/i)) {
    fs.readFile('./tasks.json', 'utf-8', (err, jsonString) => {
      if (err) {
        console.error(err)
      }
      try {
        let data = JSON.parse(jsonString)
        //data.task.updatedAt = new Date()
      } catch (error) {
        console.error(error)
      }
    })
  } else if (input.match(/^t(est)/)) {
    console.log(typeof input)
  } else {
    console.error('Invalid')
    rl.close()
  }
})
