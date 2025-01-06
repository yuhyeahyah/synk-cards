import json
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from config import TOKEN, WEBHOOK_URL, PORT, DATABASE_FILE
from database import create_tables, add_card, get_card, list_cards, add_user, add_card_to_user, get_user_cards, get_user_cards_count, get_user, delete_card, get_user_by_telegram_id, get_user_data_for_profile, get_categories, get_subcategories, get_cards_by_category_and_subcategory, deduct_user_draw, add_draw_back, add_coins
from telegram import Bot, InputMediaPhoto
from lucky_engine import select_random_card, parse_image_string
import time
import os
from responses import format_card
from commands import add_coins_command, delete_card_command

logging.basicConfig(level=logging.INFO)
create_tables()

cache = {}


bot = Bot(TOKEN)

def handle_command(text, telegram_id):
    parts = text.split()
    command = parts[0].lower()
    args = parts[1:]

    if command == "/start":
        user_id = add_user(telegram_id)
        if user_id: return "Olá! Vamos colecionar cartas juntos!"
        return "Bem vindo(a) de volta!"
    elif command == "/addcard":
        if len(args) < 4:
             return "Uso: /addcard nome categoria raridade <mensagem com imagem>"
        name = args[0]
        category = args[1]
        rarity = args[2]
        image_id = args[3]
        card_id = add_card(name, category, rarity, image_id, "")
        return f"Carta '{name}' adicionada com ID: {card_id}."

    elif command == "/getcard":
      if len(args) < 1:
        return "Uso: /getcard ID_DA_CARTA"
      card_id = args[0]
      card = get_card(card_id)
      if card:
        return (f"ID: {card[0]}\nNome: {card[1]}\nCategoria: {card[2]}\nRaridade: {card[3]}\nID da Imagem: {card[4]}")
      else:
          return "Carta não encontrada."
    elif command == "/cards":
      cards = list_cards()
      if cards:
        return "\n".join(f"ID: {card[0]}\nNome: {card[1]}\nCategoria: {card[2]}\nRaridade: {card[3]}\nID da Imagem: {card[4]}\n---" for card in cards)
      else:
          return "Nenhuma carta encontrada."
    elif command == "/givecard":
        if len(args) < 2:
           return "Uso: /givecard ID_DO_USUÁRIO ID_DA_CARTA"
        user_id = args[0]
        card_id = args[1]
        add_card_to_user(user_id, card_id)
        return f"Carta {card_id} adicionada ao inventário do usuário {user_id}."
    elif command == "/mycards":
        user_id = get_user(telegram_id)
        if not user_id:
          return "Você precisa iniciar a bot com /start"
        user_cards = get_user_cards(user_id[0])
        if user_cards:
          text = f"Você tem {get_user_cards_count(user_id[0])} cartas em sua coleção.\n\n" + "\n".join(f"ID: {card[0]}\nNome: {card[1]}\nCategoria: {card[2]}\nRaridade: {card[3]}\n---" for card in user_cards)
          return text
        else:
          return "Você não possui nenhuma carta."
    elif command == "/delcard":
      if len(args) < 1:
        return "Uso: /delcard ID_DA_CARTA"
      card_id = args[0]
      return delete_card_command(card_id)
    elif command == "/perfil":
        user = get_user_data_for_profile(telegram_id)
        if not user:
          return "Você precisa iniciar a bot com /start"
        return f"""
    Perfil 
    ID: {user[0]}
    Moedas: {user[1]}
    Cartas: {user[2]}
    Giros: {user[3]}/{user[4]}
"""
    elif command == '/girar':
          user = get_user(telegram_id)
          if not user: return "Você precisa iniciar a bot com /start"
          if user[3] >= user[4]:
            return "Seus giros acabaram. Volte mais tarde"
          categories = get_categories()
          keyboard = []
          for cat in categories:
              keyboard.append([{ "text": cat, "callback_data": f"category:{cat}" }])
          return {
          "method": "sendMessage",
          "chat_id": telegram_id,
          "text": f"Olá, {telegram_id}! Você tem {user[3]}/{user[4]} giros.\n\nPor favor, escolha uma categoria:",
          "reply_markup": { "inline_keyboard": keyboard },
          "parse_mode": "HTML"
          }
    elif command == '/addcoins':
          if len(args) < 2:
            return "Uso: /addcoins id_do_usuario quantidade"
          user_id = args[0]
          amount = args[1]
          user = get_user_by_telegram_id(user_id)
          if not user: return "Usuario não encontrado."
          return add_coins_command(user[0], int(amount))
    else:
        return "Comando inválido."

def handle_callback_query(data, telegram_id):
    if not data.get('callback_query'): return None
    text = data['callback_query'].get('data', '')
    if text.startswith('category:'):
       category = text.split(':')[1]
       subcategories = get_subcategories(category)
       keyboard = []
       for sub in subcategories:
            keyboard.append([{"text": sub, "callback_data": f"subcategory:{category}:{sub}" }])
       return {
              "method": "editMessageText",
               "chat_id": data['callback_query']['message']['chat']['id'],
              "message_id": data['callback_query']['message']['message_id'],
              "text": f"Escolha uma subcategoria para girar:",
               "reply_markup": {"inline_keyboard": keyboard},
                "parse_mode": "HTML"
           }
    elif text.startswith('subcategory:'):
        parts = text.split(':')
        category = parts[1]
        subcategory = parts[2]
        user = get_user(telegram_id)
        if not user: return "Você precisa iniciar a bot com /start"
        if user[3] >= user[4]: return "Seus giros acabaram. Volte mais tarde"
        card = select_random_card(category, subcategory, user)
        if not card: return "Ops! Algo de errado aconteceu, tente novamente."
        deduct_user_draw(user[0])
        image = parse_image_string(card["image_id"])
        
        if telegram_id not in cache or not cache[telegram_id].get('first_giro'):
          # if it's the first draw, we'll send the mp4
          cache[telegram_id] = { 'first_giro': False }
          return {
              "method": "editMessageMedia",
              "chat_id": data['callback_query']['message']['chat']['id'],
              "message_id": data['callback_query']['message']['message_id'],
              "media": {
                  "type": "animation",
                  "media": 'https://altadena.space/assets/girar-one.mp4',
                 "caption": f"Parabéns! Você ganhou:\n\n{format_card(card)}",
                  },
              "parse_mode": "HTML"
            }

        else:
          # if it is NOT the first draw, send the image only.
          return {
            "method": "editMessageMedia",
            "chat_id": data['callback_query']['message']['chat']['id'],
            "message_id": data['callback_query']['message']['message_id'],
            "media": {
              "type": "photo",
              "media": image,
               "caption": f"Parabéns! Você ganhou:\n\n{format_card(card)}",
          },
              "parse_mode": "HTML"
            }

    return None

def handle_message(data):
    text = data['message'].get('text')
    telegram_id = data['message']['from']['id']
    if not text:
        photo_id = data['message'].get('photo', None)
        if photo_id:
             #Get the biggest file size in the array of photos
            file_id =  photo_id[-1].get('file_id')
            return handle_photo(file_id, telegram_id)
        return None
    if not text.startswith('/'):
        return None
    return handle_command(text, telegram_id)


def handle_photo(file_id, telegram_id):
  # Download the file by id
  bot.get_file(file_id).then(response => {
      file_path = response["file_path"]
      file_url = f"https://api.telegram.org/file/bot{TOKEN}/{file_path}"
      print("download", file_url)
      return f"Imagem com id {file_id} recebida. use o comando /addcard para adicionar a imagem a uma carta"
  })
  return f"Imagem com id {file_id} recebida. use o comando /addcard para adicionar a imagem a uma carta"


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers['Content-Length'])
        data = json.loads(self.rfile.read(length))
        logging.info(f"Received Message: {data}")
        
        response = handle_callback_query(data, data['message']['from']['id'] if data.get('message') else data['callback_query']['from']['id'])
        if not response: response = handle_message(data)

        if response:
            telegram_id = data['message']['chat']['id'] if data.get('message') else data['callback_query']['message']['chat']['id']
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            if isinstance(response, dict):
              if response["method"] == "editMessageMedia":
                  # remove the method from the response to avoid a conflict on json.dumps
                
                  res = response["media"]
                  payload = {"method": "editMessageMedia", "chat_id": response["chat_id"], "media": json.dumps({ "type": "animation", "media": res["media"] }), "caption": res["caption"], "parse_mode": "HTML", "message_id": response["message_id"]}
                  self.wfile.write(json.dumps(payload).encode('utf-8'))
              elif response["method"] == "editMessageText":
                res = response
                payload = {"method": "editMessageText", "chat_id": res["chat_id"], "text": res["text"], "parse_mode": "HTML", "reply_markup": res["reply_markup"], "message_id": res["message_id"] }
                self.wfile.write(json.dumps(payload).encode('utf-8'))
              else:
                 payload = {**response}
                 self.wfile.write(json.dumps(payload).encode('utf-8'))
            else:
              payload = {"method": "sendMessage", "chat_id": telegram_id, "text": response, "parse_mode": "HTML"}
              self.wfile.write(json.dumps(payload).encode('utf-8'))
        else:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

    def log_message(self, format, *args):
       logging.info(format % args)


if __name__ == '__main__':
    httpd = HTTPServer(('0.0.0.0', PORT), WebhookHandler)
    print(f"Webhook server started on port {PORT}")
    print(f"Please, set this webhook on telegram: {WEBHOOK_URL}")
    bot.set_webhook(WEBHOOK_URL)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
      httpd.server_close()
      print('server stopped')
