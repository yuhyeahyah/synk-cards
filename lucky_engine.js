const { getCard } = require('./database.js')

const rarities = {
    "comum": { weight: 0.70 },
    "raro": { weight: 0.20 },
    "lendário": { weight: 0.10 },
};


const pickByWeight = (items, weightProperty) => {
    let sum = 0
    const weights = []
    for (const item of items) {
        sum += item[weightProperty]
        weights.push(sum);
    }

    const random = Math.random() * sum;
    for (let i = 0; i < items.length; i++) {
      if (random <= weights[i]) {
          return items[i]
        }
    }

    return items[0]

}

const getCardsFromCategory = async (category) => {
  const cards = []; // query to get all cards from a category on the database
  return cards;
}

const getRarityForUser = (user) => {
  const r = Object.keys(rarities).map(key => ({
    name: key,
    weight: rarities[key].weight
  }))
  // here, there should be some logic to determin what rarity the user should get based on luck, etc.
  return pickByWeight(r, 'weight')
}

// selects a random card based on their category, subcategory and rarity. if any of them is null, it'll just get a random card in the database
const selectRandomCard = async (category, subcategory, rarity) => {
  const cards = [] // query to select all cards with said filters (category, subcategory and rarity) on database
  if (cards.length === 0) {
    // if it has no filter, we'll just pick a random card
    const cardsAll = [] // query to get all cards from the database
    if (cardsAll.length == 0) return null
    return cardsAll[Math.floor(Math.random() * cardsAll.length)]
  }
  return cards[Math.floor(Math.random() * cards.length)]
}

const drawCard = async (user, category, subcategory) => {
    const rarity = getRarityForUser(user);
    const card = await selectRandomCard(category, subcategory, rarity.name)
     // insert card to user collection
    return card
}

module.exports = {
    drawCard,
    getRarityForUser,
     pickByWeight,
    selectRandomCard
  }
