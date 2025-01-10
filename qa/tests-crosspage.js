const puppeteer =  require('puppeteer');
const assert = require('chai').assert;
let browser;
let page;

// КОМАНДА ДЛЯ ЗАПУСКА ТЕСТОВ  mocha -u tdd --timeout 5000 --exit -R spec qa/tests-crosspage.js

suite('Межстраничные тесты', async () => {
  setup(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  })


  test('запрос расценок для групп со страницы туров по реке Худ должен заполнять поле реферера', async () => {
    const referrer = 'http://localhost:3000/tours/hood-river';
    try {
      await page.goto(referrer);

      await page.click('.requestGroupRate');

      const input = await page.waitForSelector('input[name="referrer"]');
      const inputValue = await input.evaluate(el => el.value);
      assert.strictEqual(inputValue, referrer);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  test('запрос расценок для групп со страницы туров пансионата "Орегон Коуст" должен заполнять поле реферера', async () => {
    const referrer = 'http://localhost:3000/tours/oregon-coast';
    try {
      await page.goto(referrer);

      await page.click('.requestGroupRate');

      const input = await page.waitForSelector('input[name="referrer"]');
      const inputValue = await input.evaluate(el => el.value);
      assert.strictEqual(inputValue, referrer);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  test('посещение страницы "Запрос цены для групп" напрямую', async () => {
    try {
      await page.goto('http://localhost:3000/tours/request-group-rate');
      const input = await page.$('input[name="referrer"]');
      const inputValue = await input.evaluate(el => el.value);
      assert(inputValue === '');
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
})
