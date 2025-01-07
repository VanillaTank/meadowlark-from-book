const express = require('express')

const app = express()
const handlebars = require('express-handlebars').create({defaultLayout: 'main'})
app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')

app.set('port', process.env.PORT || 3000)

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/about', (req, res) => {
  res.render('about')
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
