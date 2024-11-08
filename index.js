const { access, copyFile, mkdir, stat, unlink } = require('fs/promises')
const path = require('path')
const chokidar = require('chokidar')
const glob = require('glob')
const globParent = require('glob-parent')
const { name } = require('./package.json')

require('colors')

const createDirIfNotExist = async destination => {
  const dir = path.dirname(destination)
  try {
    await access(dir)
  // eslint-disable-next-line no-unused-vars
  } catch(e) {
    await mkdir(dir, { recursive: true })
  }
}

const prepareDestination = (from, entry) => {
  const result = path.join(entry.dest, path.relative(globParent(entry.files), from))

  return entry.rename ? result.replace(path.basename(result), entry.rename) : result
}

const copy = async (from, entry, verbose) => {
  const data = await stat(from)

  if (!data.isDirectory()) {
    try {
      const to = prepareDestination(from, entry)

      await createDirIfNotExist(to)
      await copyFile(from, to)

      if (verbose)
        console.log('[COPY]'.yellow, from, 'to'.yellow, to)
    } catch (e) {
      console.log('[COPY][ERROR]'.red, from)
      console.error(e)
    }
  }
}

const remove = async (from, entry, verbose) => {
  const to = prepareDestination(from, entry)

  try {
    await unlink(to)

    if (verbose)
      console.log('[DELETE]'.yellow, to)
  } catch (e) {
    console.log('[DELETE][ERROR]'.red, to)
    console.error(e)
  }
}

module.exports = (paths, { watch = process.env.ROLLUP_WATCH === 'true', verbose = false } = {}) => {
  let once = true
  return {
    name,
    buildStart() {
      if (!once)
        return

      once = false

      if (watch) {
        for (const entry of paths) {
          chokidar.watch(entry.files)
            .on('add', from => copy(from, entry, verbose))
            .on('change', from => copy(from, entry, verbose))
            .on('unlink', from => remove(from, entry, verbose))
            .on('error', e => console.error(e))
        }
      } else {
        for (const entry of paths) {
          glob.sync(entry.files).forEach(file => copy(file, entry, verbose))
        }
      }
    }
  }
}
