#! /usr/bin/env node
const readline = require('node:readline')
const { stdin: input, stdout: output } = require('node:process')

const rl = readline.createInterface({ input, output })

rl.question('Wellcome to tasker! What would you like to do:\n', input => {
  if (input.match(/(-h)/i)) {
    console.log('help...')
    rl.close()
  } else if (input.match(/^c(reate)/gi)) {
    console.log('Create...')
    rl.close()
  } else if (input.match(/^a(dd)/i)) {
    console.log('Add...')
    rl.close()
  } else {
    console.error('Invalid')
    rl.close()
  }
})
