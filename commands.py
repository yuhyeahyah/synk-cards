from database import add_coins, delete_card

def add_coins_command(user_id, amount):
    add_coins(user_id, amount)
    return f"Adicionadas {amount} moedas ao usuário {user_id}."

def delete_card_command(card_id):
    card = delete_card(card_id)
    if card:
        return (f"Carta com id '{card_id}' deletada com sucesso.")
    else:
        return "Carta não encontrada"
