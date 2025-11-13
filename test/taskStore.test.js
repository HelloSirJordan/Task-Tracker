const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const TaskStore = require('../src/taskStore')
const { STATUS } = require('../src/constants')

async function createStore () {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tasker-test-'))
  const filePath = path.join(dir, 'tasks.json')
  const store = new TaskStore(filePath)
  await store.init()
  return { store, dir }
}

test('adds tasks with incremental IDs', async () => {
  const { store } = await createStore()
  const first = await store.addTask('First task')
  const second = await store.addTask('Second task')

  assert.equal(first.id, 1)
  assert.equal(second.id, 2)
  assert.equal(store.getAllTasks().length, 2)
})

test('refuses unknown task IDs when updating status', async () => {
  const { store } = await createStore()
  await store.addTask('Only task')

  await assert.rejects(
    () => store.updateStatus(999, STATUS.DONE),
    /does not exist/
  )
})

test('ratio handles zero and non-zero totals', async () => {
  const { store } = await createStore()
  let ratio = store.getRatio()
  assert.deepEqual(ratio, { completed: 0, total: 0, percent: 0 })

  const taskA = await store.addTask('A')
  const taskB = await store.addTask('B')
  await store.updateStatus(taskA.id, STATUS.DONE)

  ratio = store.getRatio()
  assert.equal(ratio.completed, 1)
  assert.equal(ratio.total, 2)
  assert.equal(ratio.percent, 50)
})

test('counts tasks completed within the last 24 hours', async () => {
  const { store } = await createStore()
  const recent = await store.addTask('recent task')
  const old = await store.addTask('old task')

  await store.updateStatus(recent.id, STATUS.DONE)
  await store.updateStatus(old.id, STATUS.DONE)

  // Force the old task to look like it was completed two days ago
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  const oldTask = store.tasks.find(task => task.id === old.id)
  oldTask.completedAt = twoDaysAgo

  const count = store.getCompletedLast24Hours()
  assert.equal(count, 1)
})
