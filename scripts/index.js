const fs = require('fs')

/**
 * Recursively get all files in a directory that match the given extensions
 * and do not match the given exclude extensions.
 *
 * @param {string} entry - The directory to search in.
 * @param {string[]} [extensions=[]] - The file extensions to include.
 * @param {string[]} [excludeExtensions=[]] - The file extensions to exclude.
 * @returns {string[]} - An array of paths to the files found.
 */
export const getFiles = (entry, extensions = [], excludeExtensions = []) => {
  let fileNames = []
  const dirs = fs.readdirSync(entry)

  dirs.forEach((dir) => {
    const path = `${entry}/${dir}`

    if (fs.lstatSync(path).isDirectory()) {
      fileNames = [
        ...fileNames,
        ...getFiles(path, extensions, excludeExtensions),
      ]

      return
    }

    if (
      !excludeExtensions.some((exclude) => dir.endsWith(exclude)) &&
      extensions.some((ext) => dir.endsWith(ext))
    ) {
      fileNames.push(path)
    }
  })

  return fileNames
}
