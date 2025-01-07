const express = require('express')

const app = express()

app.set('port', process.env.PORT || 3000)

app.get('/', (req, res) => {
  res.type('text/plain')
  res.send('Meadowlark Travel')
})

app.get('/about', (req, res) => {
  res.type('text/plain')
  res.send('O Meadowlark Travel')
})

// 404
app.use((req, res) => {
  res.type('text/plain')
  res.status(404)
  res.send('404 - не найдено')
})

// 500
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.type('text/plain')
  res.status(500)
  res.send('500 - ошибка сервера')
})

app.listen(app.get('port'), () => {
  console.log(`Сервер запущен на http://localhost:${app.get('port')}`)
})
