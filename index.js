import express from "express";
import helmet from "helmet";
import noCache from "nocache";
import cors from "cors";
import { fetchMediaData, getFile } from "./utils/fetchMedia.js";
import "dotenv/config";
import { fileToVector } from "./utils/vectorStore.js";
// import { askAI } from "./testrag.js";
import { ask_ai } from "./start.js";
import { docuSummary } from "./documentRAG.js";
import { checkDataExists, insertData } from "./utils/databaseFunctions.js";

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
  const { object, entry } = req.body;

  if (object && entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const body = entry[0].changes[0].value;
    const { metadata, messages } = body;
    const { phone_number_id } = metadata;
    const { from, timestamp, type, document } = messages[0];

    const data = { timeStamp: timestamp, phoneNumber: from };

    const webhookSentAlready = await checkDataExists(
      "recieved_webhooks",
      "timeStamp",
      timestamp,
      "phoneNumber",
      from
    );

    if (webhookSentAlready) {
      console.log(`Message has already been processed. Skipping...`);
      return res.sendStatus(200);
    }

    await insertData("recieved_webhooks", data);
    console.log("THIS IS THE MESSAGE OBJECT", JSON.stringify(body, null, 2));
    console.log("messgge type is " + type);

    if (type === "text") {
      const msg_body = messages[0].text.body;
      console.log("Received webhook message:", msg_body);
      await ask_ai(msg_body, from, phone_number_id);
    } else if (type === "document") {
      console.log("Received document!!");
      const MEDIA_ID = document.id;
      const fileName = document.filename.replace(/ /g, "_");
      const documentData = await fetchMediaData(MEDIA_ID);
      const file = await getFile(documentData.url, fileName);
      await fileToVector(file);
      await docuSummary(
        `Summarize the contents of the document ${fileName} based on the relevant 
        information retrieved by the retrieval-augmented generation (RAG) system. 
        `,
        from,
        phone_number_id,
        fileName
      );
    } else if (type === "audio") {
      console.log("Received audio!!");
    } else {
      console.log("Unknown message type. Nothing to do.");
    }

    return res.sendStatus(200);
  }

  return res.sendStatus(404);
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
