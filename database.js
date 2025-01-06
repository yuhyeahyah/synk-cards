const sqlite3 = require('sqlite3').verbose();
const { DATABASE_FILE } = require('./config.js');

const connect = () => {
  return new sqlite3.Database(DATABASE_FILE);
};

const createTables = () => {
    const db = connect();
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                rarity TEXT,
                image_id TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER NOT NULL UNIQUE,
                coins INTEGER DEFAULT 0
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS user_cards (
                user_id INTEGER NOT NULL,
                card_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (card_id) REFERENCES cards(id),
                PRIMARY KEY (user_id, card_id)
            )
        `);
    });
    db.close()
};


const addCard = (name, category, rarity, image_id) => {
    return new Promise((resolve, reject) => {
      const db = connect();
        db.run("INSERT INTO cards (name, category, rarity, image_id) VALUES (?, ?, ?, ?)",
                    [name, category, rarity, image_id], function(err) {
                    if(err){
                        reject(err)
                        return;
                    }
                    db.close();
                    resolve(this.lastID);

        });
      
    })

};

const getCard = (card_id) => {
    return new Promise((resolve, reject) => {
    const db = connect();
      db.get("SELECT * FROM cards WHERE id = ?", [card_id], (err, row) => {
          if(err) {
             reject(err)
             return;
          }
          db.close();
          resolve(row);
      })
    })
};

const listCards = () => {
    return new Promise((resolve, reject) => {
      const db = connect();
       db.all("SELECT * FROM cards", (err, rows) => {
          if(err) {
             reject(err)
             return;
          }
         db.close()
         resolve(rows)
        })
    })
};


const addUser = (telegram_id) => {
    return new Promise((resolve, reject) => {
        const db = connect();
        db.run("INSERT INTO users (telegram_id) VALUES (?)", [telegram_id], function(err){
             if(err) {
                 db.get("SELECT id FROM users WHERE telegram_id = ?", [telegram_id], (err, row) => {
                  if(err) {
                    reject(err)
                  }
                   db.close()
                   resolve(row.id);

                 })
                return;
             }
             db.close();
             resolve(this.lastID);
        });
    })
};

const addCardToUser = (user_id, card_id) => {
    const db = connect();
     return new Promise((resolve, reject) => {
        db.run("INSERT INTO user_cards (user_id, card_id) VALUES (?, ?)", [user_id, card_id], (err) => {
            if (err) {
                reject(err);
                return
            }
            db.close()
            resolve()
        })
     })
};

const getUserCards = (user_id) => {
     return new Promise((resolve, reject) => {
         const db = connect()
         db.all(`
        SELECT cards.*
            FROM user_cards
            JOIN cards ON user_cards.card_id = cards.id
            WHERE user_cards.user_id = ?
    `, [user_id], (err, rows) => {
              if(err) {
                 reject(err)
                 return
                }
              db.close()
             resolve(rows)
        })
     })
};

const getUserCardsCount = (user_id) => {
  return new Promise((resolve, reject) => {
        const db = connect();
          db.get("SELECT COUNT(*) FROM user_cards WHERE user_id = ?", [user_id], (err, row) => {
            if (err) {
                reject(err)
                return
            }
            db.close()
            resolve(row[0])
          });
      });
};


const getUser = (telegram_id) => {
    return new Promise((resolve, reject) => {
        const db = connect()
         db.get("SELECT * FROM users WHERE telegram_id = ?", [telegram_id], (err, row) => {
             if (err) {
                 reject(err);
                 return
             }
              db.close()
             resolve(row)
          })
     })
};

const deleteCard = (card_id) => {
  return new Promise((resolve, reject) => {
     const db = connect();
       db.run("DELETE FROM cards WHERE id = ?", [card_id], (err) => {
         if (err) {
             reject(err);
                return
         }
        db.close()
        resolve()
    });
  })
}

const getUserDataForProfile = (telegram_id) => {
  return new Promise((resolve, reject) => {
      const db = connect();
      db.get(`
        SELECT 
            users.id as user_id, users.coins, COUNT(user_cards.card_id) as card_count
            FROM users LEFT JOIN user_cards
            ON users.id = user_cards.user_id WHERE users.telegram_id = ?
      `, [telegram_id], (err, row) => {
             if (err) {
                 reject(err);
                 return
            }
           db.close()
           resolve(row);
        })
  })
}


module.exports = {
    connect,
    createTables,
    addCard,
    getCard,
    listCards,
    addUser,
    addCardToUser,
    getUserCards,
    getUserCardsCount,
    getUser,
    deleteCard,
     getUserDataForProfile
};
