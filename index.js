const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');
const globParent = require('glob-parent');
const { name } = require('./package.json');

require('colors');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const createDirIfNotExist = to => {
  const dirs = [];
  let dir = path.dirname(to);

  while (dir !== path.dirname(dir)) {
    dirs.unshift(dir);
    dir = path.dirname(dir);
  }

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
};

const copy = async (from, entry) => {
  const to = path.join(entry.dest, path.relative(globParent(entry.files), from));

  createDirIfNotExist(to);

  if (!fs.statSync(from).isDirectory()) {
    try {
      await writeFileAsync(to, await readFileAsync(from));

      console.log('[COPY]'.yellow, from, 'to'.yellow, to);
    } catch (e) {
      console.log('[COPY][ERROR]'.red, from);
      console.error(e);
    }
  }
};

module.exports = paths => {
  return {
    name,
    ongenerate() {
      for (const entry of paths) {
        glob.sync(entry.files).forEach(file => copy(file, entry));
      }
    }
  };
};
