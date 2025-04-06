const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const vacationSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  priceInCents: { type: Number, required: true },
  tags: { type: [String], default: [] },
  inSeason: { type: Boolean, default: false },
  available: { type: Boolean, default: false },
  requiresWaiver: { type: Boolean, default: false },
  maximumGuests: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  packageSold: { type: Number, default: 0 },
}, { timestamps: true })

vacationSchema.methods.getDisplayPrice = function () {
  return `$${(this.priceInCents / 100).toFixed(2)}`
};

const Vacation = model('Vacation', vacationSchema);

async function setMockVacations() {
  try {
    const count = await Vacation.countDocuments();
    if (count > 0) return;

    await Vacation.insertMany([
      {
        name: 'Однодневный тур по реке Худ',
        slug: 'hood-river-day-trip',
        category: 'Однодневный тур',
        sku: 'HR199',
        description: 'Проведите день в плавании по реке Колумбия и насладитесь сваренным по традиционным рецептам пивом на реке Худ!',
        priceInCents: 9995,
        tags: ['однодневный тур', 'река худ', 'плавание', 'виндсерфинг', 'пивоварни'],
        inSeason: true,
        available: true,
        maximumGuests: 16,
        packageSold: 0,
      },
      {
        name: 'Отдых в Орегон Коуст',
        slug: 'oregon-coast-getaway',
        category: 'Отдых на выходных',
        sku: 'OC39',
        description: 'Насладитесь океанским воздухом и причудливыми прибрежными городками!',
        priceInCents: 26995,
        tags: ['отдых на выходных', 'орегон коуст', 'прогулки по пляжу'],
        inSeason: false,
        available: true,
        maximumGuests: 8,
        packageSold: 0,
      },
      {
        name: 'Скалолазание в Бенде',
        slug: 'rock-climbing-in-bend',
        category: 'Приключение',
        sku: 'B99',
        description: 'Пощекотите себе нервы горным восхождением на пустынной возвышенности.',
        priceInCents: 289995,
        tags: ['однодневый тур', 'бенд', 'скалолазание'],
        inSeason: true,
        requiresWaiver: true,
        available: false,
        maximumGuests: 4,
        packageSold: 0,
        notes: 'Гид по данному туру восстанавливается после лыжной травмы.'
      }
    ]);
  } catch (error) {
    console.error('Ошибка при добавлении моковых данных:', error)
  }
}

module.exports = {
  Vacation,
  setMockVacations,
}
