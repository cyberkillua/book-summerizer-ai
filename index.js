const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const noCache = require("nocache");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(noCache());
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.end("Works!!");
});

// handle unhandled rejections

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

// app.use(notFoundHandler);
// app.use(errorHandler);

const PORT = process.env.PORT || 4545;

app.listen(PORT, () => {
  console.log(`🚨 Server is listening at http://localhost:${PORT}`);
});
