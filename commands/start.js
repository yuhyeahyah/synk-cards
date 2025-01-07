const { addUser } = require('../database.js');

module.exports = async (telegram_id) => {
  const user_id = await addUser(telegram_id);
    if (user_id) return "Olá! Vamos colecionar cartas juntos!";
    return "Bem vindo(a) de volta!";
}
