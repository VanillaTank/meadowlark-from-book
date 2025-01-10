const fortune = require('../lib/fortune')
const expect = require('chai').expect

// КОМАНДА ДЛЯ ЗАПУСКА ТЕСТОВ  mocha -u tdd --timeout 5000 --exit -R spec qa/tests-unit.js

suite('Тесты печений-предсказаний', () => {
  test('getFortune() должна возвращать предсказание', () => {
    expect(typeof fortune.getFortune() === 'string' )
  })
})
