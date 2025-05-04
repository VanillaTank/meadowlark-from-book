const Attraction = require('./db/models/attraction')

module.exports = function (api) {
  api.get('/api/attractions', (req, res) => {

    // тут будет двойная ошибка, так как catch будет пытаться отправить статус на клиент. Может, try\catch поможет
    // setTimeout(() => {
    //   throw Error ('бабах')
    // }, 1)

    Attraction.find({ approved: true })
      .then((attractions) => {
        res.json(attractions.map(({name, _id: id, description, location} ) => ({
          name, id, description, location,
        })))
      })
      .catch(err => {
        return res.status(500).send('Произошла ошибка базы данных')
      })
  })

  api.post('/api/attraction', async (req, res) => {
    // в постамане используй body x-www-form-urlencoded,
    // так как body-parser работает только с x-www-form-urlencoded и application/json, но не с multipart/form-data
    const attraction = new Attraction({
      name: req.body.name,
      description: req.body.description,
      location: { lat: req.body.lat, lng: req.body.lng },
      history: {
        event: 'created',
        email: req.body.email,
        date: new Date(),
      },
      approved: false,
    })

    attraction.save()
      .then(({ _id: id }) => {
        res.json({ id })
      })
      .catch(err => {
        return res.status(500).send('Ошибка базы данных')
      })
  })
}
