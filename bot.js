const TelegramBot = require('node-telegram-bot-api');
const { TOKEN, WEBHOOK_URL, PORT, ADMIN_ID } = require('./config.js');
const { createTables} = require('./database.js');
const express = require('express')
const bodyParser = require('body-parser');
const startCommand = require('./commands/start.js');
const addcardCommand = require('./commands/addcard.js');
const getcardCommand = require('./commands/getcard.js');
const cardsCommand = require('./commands/cards.js');
const givecardCommand = require('./commands/givecard.js');
const mycardsCommand = require('./commands/mycards.js');
const delcardCommand = require('./commands/delcard.js');
const perfilCommand = require('./commands/perfil.js');
const drawCommand = require('./commands/draw.js');

const app = express()
app.use(bodyParser.json());

createTables();

const bot = new TelegramBot(TOKEN);
bot.setWebHook(WEBHOOK_URL);


const handleCommand = async (text, telegram_id) => {
    const parts = text.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

  switch (command) {
    case "/start":
      return await startCommand(telegram_id)
     case "/addcard":
      return await addcardCommand(text, telegram_id)
    case "/getcard":
        return await getcardCommand(text)
    case "/cards":
        return await cardsCommand()
    case "/givecard":
      return await givecardCommand(text)
    case "/mycards":
      return await mycardsCommand(telegram_id)
    case "/delcard":
         return await delcardCommand(text);
    case "/perfil":
         return await perfilCommand(telegram_id);
    case "/girar":
      return await drawCommand(telegram_id)
      default:
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
