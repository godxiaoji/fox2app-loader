/**
 * 将字段名转为驼峰式格式
 * @param {string} name 字段名
 */
function kebabCase2CamelCase(name) {
  name = name.replace(/-(\w)/g, (all, letter) => {
    return letter.toUpperCase()
  })
  return name.substr(0, 1).toLowerCase() + name.substr(1)
}

/**
 * 将字段名转为横杆连接格式
 * @param {string} name 字段名
 */
function camelCase2KebabCase(name) {
  const arr = []

  for (let i = 0; i < name.length; i++) {
    let letter = name[i]

    if (letter.charCodeAt() >= 65 && letter.charCodeAt() <= 90) {
      letter = letter.toLowerCase()
      if (i !== 0) {
        arr.push('-')
      }
    }

    arr.push(letter)
  }

  return arr.join('')
}

module.exports = {
  camelCase2KebabCase,
  kebabCase2CamelCase
}
