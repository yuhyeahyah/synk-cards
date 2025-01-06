import yaml
from yaml import safe_load

def escapeForHTML(str):
  return str.replace(/</g, '<')\
  .replace(/>/g, '>').replace(/&/g, '&')

def format_card(c):
    return f" <code>{c['id']}</code>. <b>{c['name']}</b> ({c['subcategory']})"

def replyMissingArgument (whatIsMissing, usage=None):
    first = f"Parece que você esqueceu de me dizer {whatIsMissing}. 😅"
    second = f"Use o comando da seguinte maneira: <code>{escapeForHTML(usage)}</code>" if usage else ""
    return f"{first}\n{second}\nPor favor, tente novamente."

def replyCouldNotFind (what):
  return f"Não consegui encontrar {what}. 😔\nPor favor, verifique se está tudo certo e tente novamente."
