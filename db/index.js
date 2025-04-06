const mongoose = require('mongoose')
const { mongo} = require("../credentials")

module.exports = function connectDB (evn) {
  const options = {
    server: {
      socketOptions: { keepAlive: true }
    }
  }

  switch(evn) {
    case 'development':
      return mongoose.connect(mongo.development.connectionString)
        .then(() => {
          console.log('Соединение с базой данный установлено')
        })
      break;
    case 'production':
      return mongoose.connect(mongo.production.connectionString)
        .then(() => {
          console.log('Соединение с базой данный установлено')
        })
      break;
    default:
      throw new Error(`Неизвестная среда выполнения ${evn}`)
  }
}
