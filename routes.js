const main = require('./handlers/main')

module.exports = function (app) {
  app.get('/', main.home)
  app.get('/about', main.about)
  // тут можно продолжать писать обработчики
  // и можно дальше делать подобные файлы по разделам
}
