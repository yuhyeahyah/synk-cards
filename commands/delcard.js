const { getCard, deleteCard } = require('../database.js');
const { escapeForHTML } = require('../utils.js')

module.exports = async (text) => {
    const parts = text.split(" ");
    const args = parts.slice(1);
      if (args.length < 1) {
            return "Uso: /delcard <ID_DA_CARTA>";
        }
        const card_id = args[0];
        const card = await getCard(card_id)
         if (card) {
            await deleteCard(card_id);
            return `Carta '${escapeForHTML(card.name)}' deletada com ID: ${card.id}.`;
         }
           return "Carta não encontrada."
}
