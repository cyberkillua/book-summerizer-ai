import express from "express";
import helmet from "helmet";
import noCache from "nocache";
import cors from "cors";
import { ask_ai } from "./start.js";
import { fetchMediaData, getFile } from "./utils/fetchMedia.js";
import "dotenv/config";
import { fileToVector } from "./utils/vectorStore.js";

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
app.post("/webhook", async (req, res) => {
  // console.log(JSON.stringify(req.body, null, 2));

  if (
    req.body.object &&
    req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  ) {
    const body = req.body.entry[0].changes[0].value;
    console.log("THIS IS THE MESSAGE OBJECT" + JSON.stringify(body, null, 2));
    let phone_number_id = body.metadata.phone_number_id;
    let from = body.messages[0].from;
    if (body.messages[0].type === "text") {
      const msg_body = body.messages[0].text.body;
      console.log("Received webhook message:", msg_body);
      await ask_ai(msg_body, from, phone_number_id);
    } else if (body.messages[0].type === "document") {
      console.log("sent document!!");
      const MEDIA_ID = body.messages[0].document.id;
      const document = await fetchMediaData(MEDIA_ID);
      console.log(document);
      const fileName = body.messages[0].document.filename.replace(/ /g, "_");
      const file = await getFile(document.url, fileName);
      await fileToVector(file);
    } else {
      console.log("don nothing");
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get("/webhook", (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;

  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
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
