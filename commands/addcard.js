const { addCard } = require('../database.js');
const { escapeForHTML } = require('../utils.js')

module.exports = async (text, telegram_id) => {
    const parts = text.split(" ");
    const args = parts.slice(1);
      if (args.length < 4) {
            return "Uso: /addcard <nome> <categoria> <raridade> <mensagem com imagem>";
        }
        const name = args[0];
        const category = args[1];
        const rarity = args[2];
         const image_id = args[3];
        const card_id = await addCard(name, category, rarity, image_id);
        return `Carta '${escapeForHTML(name)}' adicionada com ID: ${card_id}.`;
                                      }
