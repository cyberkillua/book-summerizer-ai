import express from "express";
import helmet from "helmet";
import noCache from "nocache";
import cors from "cors";
// import { ask_ai } from "./start.js";
import { fetchMediaData, getFile } from "./utils/fetchMedia.js";
import "dotenv/config";
import { fileToVector } from "./utils/vectorStore.js";
import { askAI } from "./testrag.js";
import { checkDataExists, insertData } from "./utils/checkWebhook.js";

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
  if (
    req.body.object &&
    req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  ) {
    const body = req.body.entry[0].changes[0].value;
    let phoneNumber = body.metadata.phone_number_id;
    let from = body.messages[0].from;
    const timeStamp = body.messages[0].timestamp;
    const data = {
      timeStamp,
      phoneNumber,
    };

    const webhookSentAlready = await checkDataExists(
      "recieved_webhooks",
      "timeStamp",
      timeStamp,
      "phoneNumber",
      phoneNumber
    );

    if (webhookSentAlready === true) {
      console.log(`Message has already been processed. Skipping...`);
      res.sendStatus(200);
      return;
    } else {
      await insertData("recieved_webhooks", data);
    }
    console.log("THIS IS THE MESSAGE OBJECT" + JSON.stringify(body, null, 2));
    if (body.messages[0].type === "text") {
      const msg_body = body.messages[0].text.body;
      console.log("Received webhook message:", msg_body);
      // await ask_ai(msg_body, from, phoneNumber);
      await askAI(msg_body, from, phoneNumber);
    } else if (body.messages[0].type === "document") {
      console.log("Recieved document!!");
      const MEDIA_ID = body.messages[0].document.id;

      const fileName = body.messages[0].document.filename.replace(/ /g, "_");

      const document = await fetchMediaData(MEDIA_ID);

      const file = await getFile(document.url, fileName);

      await fileToVector(file);
      await askAI(
        `summarize ${fileName} for me based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I cant sumarize that" Don't try to make up an answer.`,
        from,
        phoneNumber
      );
      res.sendStatus(200);
      return;
    } else {
      console.log("Unknown message type. Nothing to do.");
      res.sendStatus(200);
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
