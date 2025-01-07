const { getCard } = require('../database.js');
const { escapeForHTML } = require('../utils.js')

module.exports = async (text) => {
   const parts = text.split(" ");
    const args = parts.slice(1);
     if (args.length < 1) {
            return "Uso: /getcard <ID_DA_CARTA>";
        }
        const card_id = args[0];
        const card = await getCard(card_id)
       if (card) {
          return `ID: ${card.id}\nNome: ${escapeForHTML(card.name)}\nCategoria: ${card.category}\nRaridade: ${card.rarity}\nID da Imagem: ${card.image_id}`;
        }
        return "Carta não encontrada.";
}
