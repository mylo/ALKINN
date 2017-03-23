const _processArgs = () => {
    const args = process.argv.slice(2)
    const ret = {
        command: '',
        value: 1,
        help: false
    }

    for(int i = 0; i < arg.length; i++){

    }

    args.forEach((arg) => {
        if (!arg) { return }
        if (parseFloat(arg)) {
            ret.value = parseFloat(arg)
        } else if (arg === 'get') {
            ret.list = true
        } else if (arg === 'red' || arg === 'redwine') {
            ret.value = arg
        } else if (arg === '--help' || arg === '-h' || arg === '-?' || arg === '?') {
            ret.help = true
        } else if (arg.length === 3) {
            ret.currency = arg
        }
    })

  return ret
}

export default _processArgs()
