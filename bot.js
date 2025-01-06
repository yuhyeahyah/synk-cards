const TelegramBot = require('node-telegram-bot-api');
const { TOKEN, WEBHOOK_URL, PORT } = require('./config.js');
const { createTables, addCard, getCard, listCards, addUser, addCardToUser, getUserCards, getUserCardsCount, getUser, deleteCard, getUserDataForProfile } = require('./database.js');
const express = require('express')
const bodyParser = require('body-parser');

const app = express()
app.use(bodyParser.json());

createTables();

const bot = new TelegramBot(TOKEN);
bot.setWebHook(WEBHOOK_URL);


const handleCommand = async (text, telegram_id) => {
    const parts = text.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (command === "/start") {
        const user_id = await addUser(telegram_id);
        if (user_id) return "Olá! Vamos colecionar cartas juntos!";
        return "Bem vindo(a) de volta!";
    } else if (command === "/addcard") {
        if (args.length < 4) {
            return "Uso: /addcard <nome> <categoria> <raridade> <mensagem com imagem>";
        }
        const name = args[0];
        const category = args[1];
        const rarity = args[2];
        const image_id = args[3];
        const card_id = await addCard(name, category, rarity, image_id);
        return `Carta '${name}' adicionada com ID: ${card_id}.`;
    } else if (command === "/getcard") {
        if (args.length < 1) {
            return "Uso: /getcard <ID_DA_CARTA>";
        }
        const card_id = args[0];
       const card = await getCard(card_id)
       if (card) {
          return `ID: ${card.id}\nNome: ${card.name}\nCategoria: ${card.category}\nRaridade: ${card.rarity}\nID da Imagem: ${card.image_id}`;
        }
        return "Carta não encontrada.";
    } else if (command === "/cards") {
        const cards = await listCards();
        if (cards) {
            return cards.map(card => `ID: ${card.id}\nNome: ${card.name}\nCategoria: ${card.category}\nRaridade: ${card.rarity}\nID da Imagem: ${card.image_id}\n---`).join('\n');
          }
          return "Nenhuma carta encontrada."
    } else if (command === "/givecard") {
        if (args.length < 2) {
            return "Uso: /givecard <ID_DO_USUÁRIO> <ID_DA_CARTA>";
        }
        const user_id = args[0];
        const card_id = args[1];
        await addCardToUser(user_id, card_id);
        return `Carta ${card_id} adicionada ao inventário do usuário ${user_id}.`;
    } else if (command === "/mycards") {
        const user_id = await getUser(telegram_id)
        if (!user_id) {
          return "Você precisa iniciar a bot com /start"
        }

        const user_cards = await getUserCards(user_id.id);
        if (user_cards) {
          const text = `Você tem ${await getUserCardsCount(user_id.id)} cartas em sua coleção.\n\n` + user_cards.map(card => `ID: ${card.id}\nNome: ${card.name}\nCategoria: ${card.category}\nRaridade: ${card.rarity}\n---`).join('\n')
          return text
        }
          return "Você não possui nenhuma carta."
    }else if (command === "/delcard") {
         if (args.length < 1) {
            return "Uso: /delcard <ID_DA_CARTA>";
        }
        const card_id = args[0];
        const card = await getCard(card_id)
        if (card) {
            await deleteCard(card_id);
            return `Carta '${card.name}' deletada com ID: ${card.id}.`;
        }
         return "Carta não encontrada."
    } else if(command === "/perfil") {
          const user = await getUserDataForProfile(telegram_id)
          if (!user) {
              return "Você precisa iniciar a bot com /start"
          }
          return `
    Perfil 
    ID: ${user.user_id}
    Moedas: ${user.coins}
    Cartas: ${user.card_count}
`;
    } else {
        return "Comando inválido.";
    }
};

const handlePhoto = async(file_id, telegram_id) => {
  const r = await bot.getFile(file_id)
    const file_path = r.file_path
    const file_url = `https://api.telegram.org/file/bot${TOKEN}/${file_path}`
    console.log("download", file_url);
    return `Imagem com id ${file_id} recebida. use o comando /addcard para adicionar a imagem a uma carta`;
}


app.post(`/telegraf/${process.env.WEBHOOK_PATH || ''}`, async(req, res) => {
  try {
      const data = req.body;
       console.log(req.body);
      const response = await handleMessage(data)

      if (response) {
          const telegram_id = data.message.chat.id
          const payload = {"method": "sendMessage", "chat_id": telegram_id, "text": response}
          res.status(200).json(payload);
          console.log('message sent', payload);
      } else {
          res.status(200).send('ok');
        }
    } catch (e) {
         console.error(e)
        res.status(500).send('server error')
    }
})


const handleMessage = async (data) => {
    const text = data?.message?.text;
    const telegram_id = data?.message?.from?.id;
    if (!text) {
        const photo_id = data?.message?.photo;
        if (photo_id) {
             const file_id =  photo_id[photo_id.length - 1].file_id
            return await handlePhoto(file_id, telegram_id)
          }
       return
    }
   return await handleCommand(text, telegram_id);

}

app.get('/status', async (_, res) => {
  res.status(200).send('ok')
})
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server started on port ${PORT}`)
  console.log(`Please, set this webhook on telegram: ${WEBHOOK_URL}`)
  bot.setWebHook(WEBHOOK_URL)
});
