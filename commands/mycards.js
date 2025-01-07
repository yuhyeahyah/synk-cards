const { getUser, getUserCards, getUserCardsCount } = require('../database.js');
const { escapeForHTML } = require('../utils.js')

module.exports = async (telegram_id) => {
    const user_id = await getUser(telegram_id);
      if (!user_id) {
            return "Você precisa iniciar a bot com /start";
        }
    const user_cards = await getUserCards(user_id.id);
    if (user_cards) {
          return `Você tem ${await getUserCardsCount(user_id.id)} cartas em sua coleção.\n\n` + user_cards.map(card => `ID: ${card.id}\nNome: ${escapeForHTML(card.name)}\nCategoria: ${card.category}\nRaridade: ${card.rarity}\n---`).join('\n');
          }
          return "Você não possui nenhuma carta.";
}
