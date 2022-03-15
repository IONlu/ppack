const { spawn } = require('child_process')

const execute = function execute (command, args, opts) {
    return new Promise((resolve, reject) => {
        let stdout = ''
        let stderr = ''

        const child = spawn(command, args, opts)

        child.stdout.on('data', data => {
            stdout += data
        })
        child.stderr.on('data', data => {
            stderr += data
        })

        child.on('error', err => {
            reject(err)
        })

        child.on('close', code => {
            if (code === 0) {
                resolve(stdout.trim())
            } else {
                reject(stderr.trim())
            }
        })
    })
}

module.exports = execute