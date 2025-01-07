const { getUserDataForProfile } = require('../database.js');
const { addCommas, escapeForHTML } = require('../utils.js')

module.exports = async (telegram_id) => {
    const user = await getUserDataForProfile(telegram_id)
     if (!user) {
            return "Você precisa iniciar a bot com /start";
        }
    return `
    Perfil 
    ID: ${user.user_id}
    Moedas: ${addCommas(user.coins)}
    Cartas: ${addCommas(user.card_count)}
`;
}
