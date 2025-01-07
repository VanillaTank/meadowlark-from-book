const express = require('express')

const app = express()
const handlebars = require('express-handlebars').create({defaultLayout: 'main'})
app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')

app.set('port', process.env.PORT || 3000)

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/about', (req, res) => {
  const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)]
  res.render('about', { fortune: randomFortune })
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
