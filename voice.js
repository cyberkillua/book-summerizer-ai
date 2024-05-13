import OpenAI from "openai";
// import { send_message } from "./utils/sendMessage.js";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function speechToText(file) {
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
  });
  console.log(transcription.text);
  return transcription.text;
}
