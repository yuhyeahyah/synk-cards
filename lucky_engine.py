import random
import os
from database import get_cards_by_category_and_subcategory

rarity_chances = {
    'Comum': 0.7,
    'Raro': 0.2,
    'Lendário': 0.1
}

def select_random_card(category, subcategory, user_data):
    cards = get_cards_by_category_and_subcategory(category, subcategory)
    if not cards:
        return None

    rarity = get_rarity_from_random(user_data)
    cards_with_rarity = [c for c in cards if c[3] == rarity]

    if not cards_with_rarity:
        return select_random_card(category, subcategory, user_data)
    card = random.choice(cards_with_rarity)

    return {"id":card[0], "name":card[1], "category": card[2], "rarity": card[3], "image_id": card[4], "subcategory": card[5]}

def get_rarity_from_random(user_data):
   # we'll add some luck modifiers for future here.
  random_value = random.random()
  cumulative_chance = 0
  for rarity, chance in rarity_chances.items():
    cumulative_chance += chance
    if random_value < cumulative_chance:
        return rarity
  return "Comum"

def parse_image_string(image, useResize=True):
    if not image:
        return 'https://placehold.co/400x624.png?text=Use+/setimage+id+para+trocar+esta+imagem.'
    if image.startswith('id:'):
        return f'https://s3.girae.altadena.space/{image.split(":")[1]}.jpg'
    return image.replace('url:', '')
