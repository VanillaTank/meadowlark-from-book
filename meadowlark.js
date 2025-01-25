// https://github.com/EthanRBrown/web-development-with-node-and-express

const express = require('express')
const fortune = require('./lib/fortune')
const bodyParser = require('body-parser')

const app = express()

const handlebars = require('express-handlebars').create({
  defaultLayout:'main',
  helpers: {
    section: function(name, options){
      if(!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
})

app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')

app.set('port', process.env.PORT || 3000)

app.use(express.static(__dirname + '/public'))

// делает доступным req.body
app.use(bodyParser.urlencoded({ extended: false }))

// Тесты выводятся, если в урле есть ?test=1. Например: http://localhost:3000/about/?test=1
app.use((req, res, next) => {
  res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1'
  next()
})

app.use((req, res, next) => {
  if (!res.locals.partials) {
    res.locals.partials = {}
  }
  res.locals.partials.weatherContext = getWeatherData()
  next()
})

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/tours/request-group-rate', (req, res) => {
  res.render('tours/request-group-rate')
})

app.get('/tours/oregon-coast', (req, res) => {
  res.render('tours/oregon-coast')
})

app.get('/tours/hood-river', (req, res) => {
  res.render('tours/hood-river')
})

app.get('/jquery-test', function(req, res){
  res.render('jquery-test')
});

app.get('/about', (req, res) => {
  res.render('about', { fortune: fortune.getFortune(), pageTestScript: '/qa/tests-about.js' })
})

app.get('/nursery-rhyme', (req, res)  => {
  res.render('nursery-rhyme')
})

app.get('/data/nursery-rhyme', (req, res) => {
  res.json({
    animal: 'бельчонок',
    bodyPart: 'хвост',
    adjective: 'пушистый',
    noun: 'черт'
  })
})

app.get('/newsletter', (req, res) => {
  res.render('newsletter', { csrf: 'CSRF token goes here' });
})

app.post('/process', (req, res) => {
  // req.accepts('json.html') === 'json' смотрит, какой ответ предпочтительно отправить в зависимости от заголовка Accepts от браузера
  if (req.xhr || req.accepts('json.html') === 'json') {
    res.send({ success: true })
    // если бы тут произошла ошибка (например, отвалилась запись в базу), то
    // мы должны отправить { error: "описание ошибки" }
  } else {
    console.log('Form (from querystring): ' + req.query.form)
    console.log('CSFR token (from hidden form field): ' + req.body._csrf)
    console.log('Name (from visible form field): ' + req.body.name)
    console.log('Email (from visible form field): ' + req.body.email)
    // важно использовать 303 или 302, а не 301, так как 301 - постоянное перенаправление и браузер может его кешировать
    // вместо перенаправления (обработчик /process будет проигнорирован и юзер попадет сразу на /thank-you)
    res.redirect(303, '/thank-you')

    // если бы тут произошла ошибка (например, отвалилась запись в базу), то
    // мы должны перенаправить на страницу ошибки
  }
})

app.get('/thank-you', (req, res) => {
  res.render('thank-you')
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



function getWeatherData () {
  return {
    locations: [
      {
        name: 'Portland',
        forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
        iconUrl: '/img/cloudy.gif',
        weather: 'Overcast',
        temp: '54.1 F (12.3 C)',
      },
      {
        name: 'Bend',
        forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
        iconUrl: '/img/partlycloudy.gif',
        weather: 'Partly Cloudy',
        temp: '55.0 F (12.8 C)',
      },
      {
        name: 'Manzanita',
        forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
        iconUrl: '/img/rain.gif',
        weather: 'Light Rain',
        temp: '55.0 F (12.8 C)',
      },
    ],
  }
}
