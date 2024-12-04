const express = require('express');
const bodyParser = require("body-parser");

const app = express();
// const router = express.Router();

const userRoutes = require("./routes/user.routes");

app.use(bodyParser.json());

app.use("/api/user", userRoutes);

app.listen(3001, () => {
    console.log("App is listening at port 3001");
    
});




