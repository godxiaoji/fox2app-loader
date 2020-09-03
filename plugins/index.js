/**
 * fox2app架构解析插件
 * @author Travis
 */

class AppPlugin {
  constructor(options) {
    // 根据 options 配置你的插件
    this.mode = options.mode
  }

  apply(compiler) {
    // compiler.hooks.compilation.tap('AppPlugin', compilation => {
    //   console.log(compilation.chunks)
    // })

    compiler.hooks.emit.tapAsync('AppPlugin', (compilation, callback) => {
      if (this.mode === 'production') {
        for (const name of Object.keys(compilation.assets)) {
          if (name === 'app-service.js') {
            // 把逻辑代码包裹起来
            const newOutput = `(function(window,document,history,localStorage,location,parent,frames,frameElement){${compilation.assets[
              name
            ].source()}})()`

            compilation.assets[name] = {
              source() {
                return newOutput
              },
              size() {
                return this.source().length
              }
            }
          }
        }
      }

      callback()
    })
  }
}

module.exports = AppPlugin
