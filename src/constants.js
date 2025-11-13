const STATUS = {
  TODO: 'to-do',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete'
}

const STATUS_LABELS = {
  [STATUS.TODO]: 'To Do',
  [STATUS.IN_PROGRESS]: 'In Progress',
  [STATUS.DONE]: 'Done',
  [STATUS.CANCELED]: 'Canceled',
  [STATUS.INCOMPLETE]: 'Incomplete'
}

const STATUS_ORDER = [
  STATUS.TODO,
  STATUS.IN_PROGRESS,
  STATUS.DONE,
  STATUS.CANCELED,
  STATUS.INCOMPLETE
]

module.exports = {
  STATUS,
  STATUS_LABELS,
  STATUS_ORDER
}
