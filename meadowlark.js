// https://github.com/EthanRBrown/web-development-with-node-and-express

const express = require('express')
const http = require('http')
const fortune = require('./lib/fortune')
const bodyParser = require('body-parser')
const formidable = require('formidable')
const {cookieSecret, mongo} = require("./credentials")
const {checkWaivers, checkGuestCounts} = require("./lib/cardValidation")
const fs = require('fs')
const connectDB = require('./db/index')
const { Vacation, setMockVacations} = require('./db/models/vacation')
const VacationInSeasonListener = require("./db/models/vacationInSeasonListener")
const MongoStore = require('connect-mongo');

const app = express()

connectDB(app.get('env'))
  .then(() => {
    setMockVacations()
  })


let server

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

app.use((req, res, next) => {
 // создаем домен (типа как контекст) для этого запроса
 const domain = require('domain').create()

  // если где-то в конвейере произойдет ошибка, мы попадем сюда (но из других промежуточных ПО почему-то не попала(()
  domain.on('error', err => {
    console.error('ПЕРЕХВАЧЕНА ОШИБКА ДОМЕНА\n', err.stack)

    try {
      setTimeout(() => {
        console.error('Отказобезопасная остановка')
        process.exit(1)
      }, 5000)

      // Отключение кластера
      const worker = require('cluster').worker
      if (worker) {
        worker.disconnect()
      }

      // Прекращение принятия новых запросов
      server.close()

      // пытаемся сообщить на клиент об ошибке
      try {
        // attempt to use Express error route
        next(err);
      } catch(error){
        // if Express error route failed, try plain Node response
        console.error('Express error mechanism failed.\n', error.stack);
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Server error.');
      }
    } catch (err) {
      console.error('Не могу отправить ответ 500\n', err.stack)
    }
  })

  domain.add(req)
  domain.add(res)

  // выполняем оставшуюся часть цепочки запроса в домене
  domain.run(next)
})

app.use(express.static(__dirname + '/public'))

// bodyParser - промежуточное ПО. делает доступным req.body
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

// logging
switch(app.get('env')){
  case 'development':
    // compact, colorful dev logging
    app.use(require('morgan')('dev'));
    break;
  case 'production':
    // module 'express-logger' supports daily log rotation
    app.use(require('express-logger')({ path: __dirname + '/log/requests.log'}));
    break;
}


// позволяет устанавливать подписанные и нет cookie-файлы в res
app.use(require('cookie-parser')(cookieSecret))

// хранение сеанса в рантайме
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: cookieSecret,
  store: MongoStore.create({
    mongoUrl: mongo[app.get('env')].connectionString,
    ttl: 14 * 24 * 60 * 60 // Время жизни сессии в секундах
  })
}))

app.use(function (req, res, next) {
  // если есть алерт, поместим его в контекст, а потом удалим
  res.locals.flash = req.session.flash || ''
  delete req.session.flash
  next()
})

app.use((req, res, next) => {
  const cluster = require('cluster')
  if (cluster.isWorker) {
    console.log('Воркер %d получил запрос', cluster.worker.id)
  }
  next()
})

app.get('/', (req, res) => {

  // подписанные куки имеют приоритет над неподписанными.
  // Если назвать подписанный куки signed_monster, у вас не может быть неподписанного с таким же названием (вернется undefined)
  res.cookie('monster', 'nom nom')
  res.cookie('signed_monster', 'nom nom nom', { signed: true })

  // чтобы извлечь значение куки, если оно есть
  // const monster = req.cookies.monster
  // const signed_monster = req.cookies.signed_monster

  req.session.username = 'Anonim'
  const colorSchema = req.session.colorSchema || 'dark'

  // чтобы удалить сеанс
  // delete req.session.colorSchema

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

app.get('/newsletter/archive', function(req, res) {
  res.render('newsletter/archive');
});

app.post('/newsletter', (req, res) => {
  const name = req.body.name || ''
  const email = req.body.email || ''
  const VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

  if (!email.match(VALID_EMAIL_REGEX)) {
    if (req.xhr) {
      return res.json({ error: 'Некорректный адрес электронной почты' })
    }
    req.session.flash = {
      type: 'danger',
      intro: 'Ошибка проверки!',
      message: 'Введенный вами адрес электронной почты не корректный'
    }
    return res.redirect(303, '/newsletter/archive')
  }

  function NewslatterSignUp() { }
  NewslatterSignUp.prototype.save = function (cb) {
    cb();
  };

  new NewslatterSignUp({ name: name, email: email }).save(function(err) {
    if(err) {
      if(req.xhr) {
        return res.json({
          error: 'Database error.'
        });
      }

      req.session.flash = {
        type: 'danger',
        intro: 'Database error!',
        message: 'There was a database error; please try again later.',
      };

      return res.redirect(303, '/newsletter/archive');
    }

    if(req.xhr) {
      return res.json({ success: true });
    }

    req.session.flash = {
      type: 'success',
      intro: 'Thank you!',
      message: 'You have now been signed up for the newsletter.',
    };

    return res.redirect(303, '/newsletter/archive');
  })
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

app.get('/contest/vacation-photo', (req, res) => {
  const now = new Date()
  res.render('contest/vacation-photo', { year: now.getFullYear(), month: now.getMonth() })
})

const dataDir = __dirname + '/data'
const vacationPhotoDir = dataDir  + '/vacation-photo'
fs.existsSync(dataDir) || fs.mkdirSync(dataDir)
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir)


function saveContextEntry (contestName, email, year, month, photoPath) {
  // todo
}

app.post('/contest/vacation-photo/:year/:month', (req, res) => {
  const form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.session.flash = {
        type: 'danger',
        intro: 'Упс!',
        message: 'Во время обработки формы произошла ошибка. Пожалуйста, попробуйте еще раз'
      }
      return res.redirect(303, '/contest/vacation-photo')
    }
    const photo = files.photo
    const dir = `${vacationPhotoDir}/${Date.now()}`
    fs.mkdirSync(dir)
    fs.renameSync(photo.path, `${dir}/${photo.name}`)
    /* Использовать photo.name - плохая практика, так как могут заслать вредоносный exe.
    * Лучше дать файлу случайное имя, оставить только расширение, проверив, что оно состоит из алфавитно-цифровых символов */
    const path = `${dir}/${photo.name}`
    saveContextEntry('vacation-photo', fields.email, req.params.year, req.params.month, path)

    req.session.flash = {
      type: 'success',
      intro: 'Удачи!',
      message: 'Вы стали участником конкурса'
    }

    res.redirect(303, '/contest/vacation-photo/entries')
  })
})

app.use(checkWaivers)
app.use(checkGuestCounts)
// тут должны быть роуты, обрабатывающие /cart, но в книге про них не написано
// см. https://github.com/EthanRBrown/web-development-with-node-and-express/blob/master/ch10/meadowlark.js


app.get('/fail', (req, res) => {
  throw new Error('Нет!')
})

app.get('/epic-fail', (req, res) => {
  process.nextTick(function () {
    throw new Error('Бабах!')
  })
})

function convertFromUSD (value, currency) {
  switch (currency) {
    case 'USD': return value * 1;
    case 'GBP': return value * 0.6;
    case 'BTC': return value * 0.00238;
    default: return NaN;
  }
}

app.get('/vacations', function(req, res){
  console.log(req.session.currency)
  Vacation.find({ available: true })
    .then((vacations) => {
      const currency = req.session.currency || 'USD';
      const context = {
        currency: currency,
        vacations: vacations.map(function(vacation){
          return {
            sku: vacation.sku,
            name: vacation.name,
            description: vacation.description,
            inSeason: vacation.inSeason,
            price: convertFromUSD(vacation.priceInCents/100, currency),
            qty: vacation.qty,
          };
        })
      }

      switch(currency){
        case 'USD': context.currencyUSD = 'selected'; break;
        case 'GBP': context.currencyGBP = 'selected'; break;
        case 'BTC': context.currencyBTC = 'selected'; break;
      }

      res.render('vacations', context);
    })
});

app.get('/set-currency/:currency', (req, res) => {
  req.session.currency = req.params.currency
  return res.redirect(303, '/vacations')
})

app.get('/notify-me-when-in-season', (req, res) => {
  res.render('notify-me-when-in-season', { sku: req.query.sku })
})

app.post('/notify-me-when-in-season', (req, res) => {
  VacationInSeasonListener.updateOne(
    { email: req.body.email },
    { $push: { skus: req.body.sku } },
    { upsert: true }
    ).then(() => {
      req.session.flash = {
        type: 'success',
        intro: 'Спасибо!',
        message: 'Вы будете оповещены, когда наступит сезон для этого тура'
      }
      res.redirect(303, '/vacations')
  })
    .catch(err => {
      console.error(err.stack)
      req.session.flash = {
        type: 'danger',
        intro: 'Упс!',
        message: 'При обработке вашего запроса произошла ошибка'
      }
      res.redirect(303, '/vacations')
    })
})

// 404
app.use((req, res) => {
  res.status(404)
  res.render('404')
})

// 500
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render('500')
})

function startServer () {
  server = http.createServer(app).listen(app.get('port'), function(){
    console.log(`Сервер запущен в среде выполнения ${app.get('env')} на http://localhost:${app.get('port')}`)
  })
}

if (require.main === module) {
  // приложение запускается непосредственно, запускаем сервер
  startServer()
} else {
  // приложение импортируется как модуль посредством require - экспортируем функцию для создания сервера
  module.exports = startServer
}



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
