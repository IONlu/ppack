const path = require('path')
const sade = require('sade')
const { readJson } = require('fs-extra')
const ppack = require('./ppack.js')

readJson(path.resolve(__dirname, '../package.json'))
    .then(package => {
        sade('ppack [dir]', true)
            .version(package.version)
            .describe(package.description)
            .example('/path/to/package')
            .example('--pack-destination /tmp')
            .option('-D, --pack-destination', 'Directory in which ppack will save the tarball')
            .action((dir, opts) => {
                ppack(dir, {
                    ...opts,
                    log: data => console.log(data)
                }).catch(() => { })
            })
            .parse(process.argv)
    })