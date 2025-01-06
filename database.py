import sqlite3
from config import DATABASE_FILE

def connect():
    return sqlite3.connect(DATABASE_FILE)

def create_tables():
    with connect() as con:
      cur = con.cursor()
      cur.execute("""
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            rarity TEXT,
            image_id TEXT,
            subcategory TEXT
        )
      """)

      cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER NOT NULL UNIQUE,
            coins INTEGER DEFAULT 0,
            used_draws INTEGER DEFAULT 0,
            maximum_draws INTEGER DEFAULT 10
        )
      """)

      cur.execute("""
         CREATE TABLE IF NOT EXISTS user_cards (
             user_id INTEGER NOT NULL,
             card_id INTEGER NOT NULL,
             FOREIGN KEY (user_id) REFERENCES users(id),
             FOREIGN KEY (card_id) REFERENCES cards(id),
             PRIMARY KEY (user_id, card_id)
         )
        """)
      con.commit()

def add_card(name, category, rarity, image_id, subcategory):
    with connect() as con:
        cur = con.cursor()
        cur.execute("INSERT INTO cards (name, category, rarity, image_id, subcategory) VALUES (?, ?, ?, ?, ?)",
                    (name, category, rarity, image_id, subcategory))
        con.commit()
        return cur.lastrowid

def get_card(card_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT * FROM cards WHERE id = ?", (card_id,))
        return cur.fetchone()

def list_cards():
    with connect() as con:
      cur = con.cursor()
      cur.execute("SELECT * FROM cards")
      return cur.fetchall()


def add_user(telegram_id):
     with connect() as con:
        cur = con.cursor()
        try:
            cur.execute("INSERT INTO users (telegram_id) VALUES (?)", (telegram_id,))
            con.commit()
            return cur.lastrowid
        except sqlite3.IntegrityError:
           cur.execute("SELECT id FROM users WHERE telegram_id = ?", (telegram_id,))
           return cur.fetchone()[0]


def add_card_to_user(user_id, card_id):
  with connect() as con:
    cur = con.cursor()
    cur.execute("INSERT INTO user_cards (user_id, card_id) VALUES (?, ?)",
               (user_id, card_id))
    con.commit()

def get_user_cards(user_id):
  with connect() as con:
    cur = con.cursor()
    cur.execute("""
      SELECT cards.*
        FROM user_cards
        JOIN cards ON user_cards.card_id = cards.id
        WHERE user_cards.user_id = ?
    """, (user_id,))
    return cur.fetchall()


def get_user_cards_count(user_id):
  with connect() as con:
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM user_cards WHERE user_id = ?", (user_id,))
    return cur.fetchone()[0]

def get_user(telegram_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
        return cur.fetchone()

def delete_card(card_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("DELETE FROM cards WHERE id = ?", (card_id,))
        con.commit()

def get_user_by_telegram_id(telegram_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
        return cur.fetchone()

def get_user_data_for_profile(telegram_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
           SELECT 
            users.id as user_id, users.coins, COUNT(user_cards.card_id) as card_count, used_draws, maximum_draws
            FROM users LEFT JOIN user_cards
            ON users.id = user_cards.user_id WHERE users.telegram_id = ?
        """, (telegram_id,))
        return cur.fetchone()

def get_categories():
   with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT DISTINCT category FROM cards")
        return [row[0] for row in cur.fetchall()]

def get_subcategories(category):
  with connect() as con:
    cur = con.cursor()
    cur.execute("SELECT DISTINCT subcategory FROM cards WHERE category = ?", (category,))
    return [row[0] for row in cur.fetchall()]

def get_cards_by_category_and_subcategory(category, subcategory):
  with connect() as con:
    cur = con.cursor()
    cur.execute("SELECT * FROM cards WHERE category = ? AND subcategory = ?", (category, subcategory))
    return cur.fetchall()

def get_random_card_from_category_subcategory(category, subcategory, rarity):
  with connect() as con:
    cur = con.cursor()
    cur.execute("SELECT * FROM cards WHERE category = ? AND subcategory = ? AND rarity = ? ORDER BY RANDOM() LIMIT 1", (category, subcategory, rarity))
    return cur.fetchone()

def deduct_user_draw(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("UPDATE users SET used_draws = used_draws + 1 WHERE id = ?", (user_id,))
        con.commit()

def add_draw_back(user_id):
  with connect() as con:
    cur = con.cursor()
    cur.execute("UPDATE users SET used_draws = used_draws - 1 WHERE id = ?", (user_id,))
    con.commit()

def add_coins(user_id, amount):
    with connect() as con:
      cur = con.cursor()
      cur.execute("UPDATE users SET coins = coins + ? WHERE id = ?", (amount, user_id,))
      con.commit()
