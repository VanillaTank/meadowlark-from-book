const fortune = require('../lib/fortune')

exports.home = (req, res) => {
  res.render('home')
}
exports.about = (req, res) => {
  res.render('about', { fortune: fortune.getFortune(), pageTestScript: '/qa/tests-about.js' })
}
