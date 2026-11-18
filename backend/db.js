const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');

const schemaPath = path.resolve(__dirname, '../database/schema.sql');

async function createDatabase(databasePath = process.env.DB_PATH || path.resolve(__dirname, '../database/gameshelf.db')) {
  const SQL = await initSqlJs();
  const isPersistent = databasePath !== ':memory:';
  const databaseBytes = isPersistent && fs.existsSync(databasePath) ? fs.readFileSync(databasePath) : undefined;
  const database = new SQL.Database(databaseBytes);
  database.run('PRAGMA foreign_keys = ON');

  function persist() {
    if (!isPersistent) return;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    fs.writeFileSync(databasePath, Buffer.from(database.export()));
  }

  database.run(fs.readFileSync(schemaPath, 'utf8'));
  persist();

  return {
    prepare(sql) {
      return {
        run(...params) {
          database.run(sql, params);
          const result = {
            changes: database.getRowsModified(),
            lastInsertRowid: database.exec('SELECT last_insert_rowid() AS id')[0]?.values[0][0] || 0
          };
          persist();
          return result;
        },
        get(...params) {
          const statement = database.prepare(sql);
          statement.bind(params);
          const row = statement.step() ? statement.getAsObject() : undefined;
          statement.free();
          return row;
        },
        all(...params) {
          const statement = database.prepare(sql);
          statement.bind(params);
          const rows = [];
          while (statement.step()) rows.push(statement.getAsObject());
          statement.free();
          return rows;
        }
      };
    },
    close() {
      persist();
      database.close();
    }
  };
}

module.exports = { createDatabase };
