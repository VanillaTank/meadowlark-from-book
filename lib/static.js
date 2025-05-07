const baseUrl = '' // вообще надо убирать в конфигурацию

exports.map = function (name) {
  return baseUrl + name
}
