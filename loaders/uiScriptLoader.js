const path = require('path')
// const qs = require('querystring')
const fse = require('fs-extra')
// const loaderUtils = require('loader-utils')
const { isObject } = require('util')
const { kebabCase2CamelCase } = require('../helpers/util')

function readJson(filePath) {
  try {
    return fse.readJsonSync(filePath)
  } catch (e) {
    return {}
  }
}

function getRequireRelativePath(from, to) {
  let relativePath = path.relative(path.dirname(from), to).replace(/\\/g, '/')

  if (relativePath.indexOf('/') === -1) {
    relativePath = './' + relativePath
  }

  return relativePath
}

module.exports = function(source) {
  const loaderContext = this

  const { rootContext, resourcePath } = loaderContext
  const context = rootContext || process.cwd()

  const jsonCont = readJson(resourcePath.replace('.js', '.json'))

  const compRequirePaths = []
  const compNames = []
  if (isObject(jsonCont.usingComponents)) {
    for (const k in jsonCont.usingComponents) {
      const compName = kebabCase2CamelCase(k)
      let compPath = jsonCont.usingComponents[k]

      if (compPath.startsWith('/')) {
        compPath = path.resolve(context, './src' + compPath + '.fxml')
      } else {
        compPath = path.resolve(path.dirname(resourcePath), compPath + '.fxml')
      }

      compRequirePaths.push(
        `import ${compName} from '${getRequireRelativePath(
          resourcePath,
          compPath
        )}';`
      )
      compNames.push(compName)
    }
  }

  const route = path
    .relative(context, resourcePath)
    .replace(/^(\.\.[/\\])+/, '')
    .replace(/\\/g, '/')
    .replace(/^src\//, '')
    .replace(/.js$/, '')

  const isPage = route.startsWith('pages')

  let code =
    compRequirePaths.join(`\n`) +
    source.replace(
      /^[^]*export\sdefault[\s]+\{/,
      `\nexport default ${
        isPage ? 'Page' : 'Component'
      }({route:'${route}',components:{${compNames.join(',')}}},{`
    ) +
    ')'

  return code
}
