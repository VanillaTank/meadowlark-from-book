const fortunes = [
  'Завтра будет солнечный день.',
  'Тебя ждёт приятный сюрприз.',
  'Ты скоро встретишь старого друга.',
  'Тебе подарят цветы.',
  'Сегодня вечером ты будешь счастлив.',
]

exports.getFortune = () => fortunes[Math.floor(Math.random() * fortunes.length)]
