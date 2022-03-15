const path = require('path')
const os = require('os')
const { readJson, writeJson, copy, rm, ensureDir } = require('fs-extra')
const execute = require('./execute.js')

const ppack = async function ppack (dir, opts) {
    const packageFolder = dir ? path.resolve(dir) : process.cwd()
    const targetFolder = opts['pack-destination'] ? path.resolve(opts['pack-destination']) : packageFolder
    const tempFolder = path.resolve(os.tmpdir(), '_ppack_' + Math.random().toString(36).replace(/[^a-z]+/g, ''))
    const log = opts.log || (() => { })

    // load package file
    const packageFile = path.resolve(packageFolder, 'package.json')
    const package = await readJson(packageFile)

    log(`Packing package ${package.name}:${package.version} started`)

    try {
        // copy package to temp folder
        await copy(packageFolder, tempFolder, {
            filter: src => {
                return !src.match('node_modules')
            }
        })

        // set pnpm config
        await execute('pnpm', ['config', '--location', 'project', 'set', 'shamefully-hoist=true'], {
            cwd: tempFolder
        })

        // update package info
        package.bundledDependencies = true
        if (package.dependencies) {
            await Promise.all(
                Object.entries(package.dependencies).map(
                    async ([name, version]) => {
                        if (version.match(/^workspace:/)) {
                            const path = await execute('pnpm', ['--filter', name, 'exec', 'pwd'])
                            package.dependencies[name] = `link:${path}`
                        }
                    }
                )
            )
        }
        await writeJson(path.resolve(tempFolder, 'package.json'), package)

        // install packages
        await execute('pnpm', ['i', '--prefer-offline'], {
            cwd: tempFolder
        })

        // remove dev packages
        await execute('pnpm', ['prune'], {
            cwd: tempFolder
        })

        // create targetFolder
        await ensureDir(targetFolder)

        // create the tarball
        await execute('pnpm', ['pack', '--pack-destination', path.resolve(targetFolder)], {
            cwd: tempFolder
        })

        log(`Packing package ${package.name}:${package.version} successful`)
    } catch (err) {
        log(`Packing package ${package.name}:${package.version} failed with error ${err.message}`)
        throw err
    } finally {
        // cleanup
        await rm(tempFolder, { recursive: true, force: true });
    }
}

module.exports = ppack