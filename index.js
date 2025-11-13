#! /usr/bin/env node
const { Command } = require('commander')
const TaskStore = require('./src/taskStore')
const { STATUS, STATUS_LABELS, STATUS_ORDER } = require('./src/constants')

const program = new Command()
const store = new TaskStore()

program
  .name('tasker')
  .description('A CLI app to track, update, and report on your tasks.')
  .version('1.0.2')

program.hook('preAction', async () => {
  await store.init()
})

const runSafely = handler => {
  return async (...args) => {
    try {
      await handler(...args)
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
    }
  }
}

program
  .command('add')
  .argument('<description...>', 'Description of the task')
  .description('Create a new task')
  .action(
    runSafely(async descriptionParts => {
      const description = descriptionParts.join(' ')
      const task = await store.addTask(description)
      console.log(`Task added successfully (ID: ${task.id})`)
    })
  )

program
  .command('list')
  .argument('[filter]', 'status (to-do, done, etc.) or special view')
  .description('List tasks, filter by status, or show stats')
  .action(
    runSafely(async filter => {
      if (!filter) {
        const tasks = store.getAllTasks().sort(sortByStatusThenId)
        printTasks(tasks, 'All Tasks')
        return
      }

      const normalized = filter.toLowerCase()
      if (normalized === 'ratio') {
        const { completed, total, percent } = store.getRatio()
        console.log(`Completed ${completed}/${total} tasks (${percent}%)`)
        return
      }

      if (normalized === 'last-24') {
        const count = store.getCompletedLast24Hours()
        console.log(`${count} task(s) completed in the last 24 hours`)
        return
      }

      const tasks = store.getTasksByStatus(normalized)
      const heading = `Tasks - ${STATUS_LABELS[normalized] || normalized}`
      printTasks(tasks, heading)
    })
  )

program
  .command('update')
  .argument('<id>', 'ID of the task to update')
  .argument('<description...>', 'New description')
  .description('Update a task description')
  .action(
    runSafely(async (id, descriptionParts) => {
      const description = descriptionParts.join(' ')
      const task = await store.updateTask(id, description)
      console.log(`Task updated successfully (ID: ${task.id})`)
    })
  )

program
  .command('mark')
  .argument('<id>', 'ID of the task to update')
  .argument('<status>', 'New status (to-do, in-progress, done, canceled, incomplete)')
  .description('Change the status of a task')
  .action(
    runSafely(async (id, status) => {
      const task = await store.updateStatus(id, status)
      console.log(`Task status updated successfully (ID: ${task.id})`)
    })
  )

program
  .command('delete')
  .argument('<id>', 'ID of the task to delete')
  .description('Delete a task')
  .action(
    runSafely(async id => {
      const task = await store.deleteTask(id)
      console.log(`Task deleted successfully (ID: ${task.id})`)
    })
  )

program.addHelpText(
  'afterAll',
  `

List filters:
  to-do | in-progress | done | canceled | incomplete
  ratio              Show the completion ratio
  last-24            Tasks completed in the last 24 hours
`
)

program.parseAsync(process.argv)

function printTasks (tasks, heading) {
  console.log(`\n${heading}`)
  if (tasks.length === 0) {
    console.log('  (no tasks found)')
    return
  }

  const columns = [
    { label: 'ID', width: 4, key: task => String(task.id) },
    {
      label: 'Status',
      width: 12,
      key: task => STATUS_LABELS[task.status] || task.status
    },
    { label: 'Description', width: 50, key: task => task.description },
    { label: 'Updated', width: 20, key: task => formatDate(task.updatedAt || task.createdAt) }
  ]

  const header = columns.map(col => col.label.padEnd(col.width)).join('  ')
  console.log(header)
  console.log('-'.repeat(header.length))

  tasks.forEach(task => {
    const row = columns
      .map(col => truncate(col.key(task), col.width).padEnd(col.width))
      .join('  ')
    console.log(row)
  })
}

function truncate (value, maxLength) {
  const str = value || ''
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 1)}…`
}

function formatDate (dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function sortByStatusThenId (a, b) {
  const statusWeight = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  if (statusWeight !== 0) return statusWeight
  return a.id - b.id
}
