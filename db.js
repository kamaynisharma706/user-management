const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgres://u62gv3g7jokq3n:pd808a38a1344a08229ec612af053012497ffb572bb58c321852a1b971e4a38e9@ec2-35-173-117-186.compute-1.amazonaws.com:5432/d6rm2bfolkka",
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => {
    console.log("Database is connected!");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
};