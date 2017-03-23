var chalk = require('chalk');

let usage = 'usage: alkinn <command> <string> [-h | --help]'
    usage += '\n'
    usage += `\n${chalk.bold('command:')}      A command,\tsee ${chalk.bold('alkinn commands')}`
    usage += `\n${chalk.bold('string:')}       A string, \tsee ${chalk.bold('alkinn commands')}`
    usage += `\n${chalk.bold('-h | --help:')}  Show these instructions`
    usage += '\n\n'
    usage += chalk.italic('Other available commands')
    usage += `\n${chalk.bold('alkinn commands')}    Display list of all commands`

export default usage