const path = require('path')
const hash = require('hash-sum')
// const qs = require('querystring')
const loaderUtils = require('loader-utils')
const { compileTemplate } = require('@vue/component-compiler-utils')
const componentNormalizerPath = require.resolve('./runtime/componentNormalizer')
const vueTemplateCompiler = require('vue-template-compiler')
const uiScriptLoaderPath = require.resolve('./loaders/uiScriptLoader.js')

module.exports = function(source) {
  const loaderContext = this

  const {
    // request,
    minimize,
    // sourceMap,
    rootContext,
    resourcePath,
    resourceQuery
  } = loaderContext

  // console.log({
  //   request,
  //   minimize,
  //   sourceMap,
  //   rootContext,
  //   resourcePath,
  //   resourceQuery
  // })

  // const rawQuery = resourceQuery.slice(1)
  // const inheritQuery = `&${rawQuery}`
  // const incomingQuery = qs.parse(rawQuery)
  const options = loaderUtils.getOptions(loaderContext) || {}

  const isProduction =
    options.productionMode || minimize || process.env.NODE_ENV === 'production'

  let isFunctional
  const isServer = loaderContext.target === 'node'
  const filename = path.basename(resourcePath)
  const context = rootContext || process.cwd()
  // const sourceRoot = path.dirname(path.relative(context, resourcePath))
  const isShadow = false
  const hasScoped = true

  // module id for scoped CSS & hot-reload
  const rawShortFilePath = path
    .relative(context, resourcePath)
    .replace(/^(\.\.[/\\])+/, '')
  const shortFilePath = rawShortFilePath.replace(/\\/g, '/') + resourceQuery
  const id = hash(isProduction ? shortFilePath + '\n' + source : shortFilePath)

  function doCompileTemplate() {
    const compilerOptions = Object.assign(
      {
        outputSourceRange: true
      },
      options.compilerOptions,
      {
        scopeId: `data-v-${id}`,
        comments: undefined
      }
    )

    // for vue-component-compiler
    const finalOptions = {
      source,
      filename: this.resourcePath,
      compiler: vueTemplateCompiler,
      compilerOptions,
      // allow customizing behavior of vue-template-es2015-compiler
      transpileOptions: options.transpileOptions,
      transformAssetUrls: options.transformAssetUrls || true,
      isProduction,
      isFunctional,
      optimizeSSR: isServer && options.optimizeSSR !== false,
      prettify: options.prettify
    }

    return compileTemplate(finalOptions)
  }

  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)

  const genRequest = (loaders, resourcePath) => {
    // Important: dedupe since both the original rule
    // and the cloned rule would match a source import request.
    // also make sure to dedupe based on loader path.
    // assumes you'd probably never want to apply the same loader on the same
    // file twice.
    // Exception: in Vue CLI we do need two instances of postcss-loader
    // for user config and inline minification. So we need to dedupe baesd on
    // path AND query to be safe.
    const seen = new Map()
    const loaderStrings = []

    loaders.forEach(loader => {
      const identifier =
        typeof loader === 'string' ? loader : loader.path + loader.query
      const request = typeof loader === 'string' ? loader : loader.request
      if (!seen.has(identifier)) {
        seen.set(identifier, true)
        // loader.request contains both the resolved loader path and its options
        // query (e.g. ??ref-0)
        loaderStrings.push(request)
      }
    })

    return stringifyRequest(
      '-!' + [...loaderStrings, resourcePath + this.resourceQuery].join('!')
    )
  }

  const templateCompiled = doCompileTemplate()

  const cssFilePath = filename.replace('.fxml', '.css')
  const stylesImport = `import "./${cssFilePath}"`

  const scriptFilePath = genRequest(
    [uiScriptLoaderPath],
    resourcePath.replace('.fxml', '.js')
  )
  const scriptImport = `import script from ${scriptFilePath}`

  const jsonFilePath = filename.replace('.fxml', '.json')
  const jsonImport = `import "./${jsonFilePath}"`

  // 获取模板 var render var staticRenderFns

  let code =
    `
  ${jsonImport}
  ${scriptImport}
  ${stylesImport}
  ${templateCompiled.code}

  /* normalize component */
  import normalizer from ${stringifyRequest(`!${componentNormalizerPath}`)}
  var component = normalizer(
    script,
    render,
    staticRenderFns,
    ${isFunctional ? `true` : `false`},
  null,
  ${hasScoped ? JSON.stringify(id) : `null`},
null
${isShadow ? `,true` : ``}
)
`.trim() + `\n`

  // Expose filename. This is used by the devtools and Vue runtime warnings.
  if (!isProduction) {
    // Expose the file's full path in development, so that it can be opened
    // from the devtools.
    code += `\ncomponent.options.__file = ${JSON.stringify(
      rawShortFilePath.replace(/\\/g, '/')
    )} `
  } else if (options.exposeFilename) {
    // Libraries can opt-in to expose their components' filenames in production builds.
    // For security reasons, only expose the file's basename in production.
    code += `\ncomponent.options.__file = ${JSON.stringify(filename)} `
  }

  if (shortFilePath.startsWith('src/pages')) {
    code += `\nvar _ = component.exports; `
    code += `\nnew Vue({ render: h => h(_) }).$mount('#app')`
  } else {
    code += `\nexport default component.exports`
  }

  return code
}
