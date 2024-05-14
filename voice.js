import OpenAI from "openai";
import { send_message } from "./utils/sendMessage.js";
// import fs from "fs";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function speechToText(file, from, phone_number_id) {
  console.log("calling openai");
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
    response_format: "text",
  });
  console.log(transcription.text);
  await send_message(transcription.text, from, phone_number_id);

  return transcription.text;
}
