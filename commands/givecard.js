const { addCardToUser } = require('../database.js');

module.exports = async (text) => {
    const parts = text.split(" ");
    const args = parts.slice(1);
    if (args.length < 2) {
      return "Uso: /givecard <ID_DO_USUÁRIO> <ID_DA_CARTA>";
     }
    const user_id = args[0];
    const card_id = args[1];
    await addCardToUser(user_id, card_id);
    return `Carta ${card_id} adicionada ao inventário do usuário ${user_id}.`;
}
