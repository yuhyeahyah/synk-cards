const { listCards } = require('../database.js');
const { escapeForHTML } = require('../utils.js')
module.exports = async () => {
    const cards = await listCards();
       if (cards) {
            return cards.map(card => `ID: ${card.id}\nNome: ${escapeForHTML(card.name)}\nCategoria: ${card.category}\nRaridade: ${card.rarity}\nID da Imagem: ${card.image_id}\n---`).join('\n');
        }
        return "Nenhuma carta encontrada."
}
