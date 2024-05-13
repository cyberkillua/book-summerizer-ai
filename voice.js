import OpenAI from "openai";
import { send_message } from "./utils/sendMessage.js";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function speechToText(file, from, phone_number_id) {
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
  });
  console.log(transcription.text);
  await send_message(transcription.text, from, phone_number_id);

  return transcription.text;
}
