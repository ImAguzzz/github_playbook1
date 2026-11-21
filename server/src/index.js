const path = require("node:path");
const { createApp } = require("./app");
const { openDatabase } = require("./database");

const databasePath = process.env.DATABASE_PATH || path.resolve(__dirname, "../data/ruang.db");
const database = openDatabase(databasePath);
const app = createApp(database);
const port = Number(process.env.PORT) || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Ruang API and dashboard are running at http://localhost:${port}`);
});
