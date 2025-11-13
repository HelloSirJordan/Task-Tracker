# Tasker

A simple task tracker CLI app to add, update, list, and delete tasks.

## Installation

Use NPM to install Tasker

```bash
npm i @hellosirjordan/tasker
```

## Useage

```bash
# Create task

tasker add "go to the bank"

# List all tasks

tasker list

# List task by status

tasker list to-do
tasker list in-progress
tasker list done
tasker list canceled
tasker list incomplete

# List completed ratio

tasker list ratio

# List completed in the last 24 hours

tasker list last-24

# Update task's description

tasker update 1 "withdraw cash from the bank on monday"

# Change task status

tasker mark 1 in-progress
tasker mark 1 done
tasker mark 1 canceled
tasker mark 1 incomplete

# Delete task

tasker delete 1

## Data storage

Tasker stores its data in a single JSON file located at:

- Linux/macOS: `~/.local/share/tasker/tasks.json` (or `$XDG_DATA_HOME/tasker/tasks.json` if `XDG_DATA_HOME` is set)
- Windows: `%APPDATA%/tasker/tasks.json`

Set the `TASKER_DATA_FILE` environment variable if you want to store tasks in a custom location (useful for syncing via git or building automated tests).

## Development

Run the automated tests with:

```bash
npm test
```
```
