// https://github.com/EthanRBrown/web-development-with-node-and-express

const express = require('express')

const app = express()
const handlebars = require('express-handlebars').create({defaultLayout: 'main'})
app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')

app.set('port', process.env.PORT || 3000)

app.use(express.static(__dirname + '/public'))

// Тесты выводятся, если в урле есть ?test=1. Например: http://localhost:3000/about/?test=1
app.use((req, res, next) => {
  res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1'
  next()
})

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/about', (req, res) => {
  const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)]
  res.render('about', { fortune: randomFortune, pageTestScript: '/qa/tests-about.js' })
})

// 404
app.use((req, res) => {
  res.status(404)
  res.render('404')
})

// 500
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500)
  res.render('500')
})

app.listen(app.get('port'), () => {
  console.log(`Сервер запущен на http://localhost:${app.get('port')}`)
})

const fortunes = [
  'Завтра будет солнечный день.',
  'Тебя ждёт приятный сюрприз.',
  'Ты скоро встретишь старого друга.',
  'Тебе подарят цветы.',
  'Сегодня вечером ты будешь счастлив.',
]
