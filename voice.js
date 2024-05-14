import OpenAI from "openai";
import { send_message } from "./utils/sendMessage.js";
// import fs from "fs";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function speechToText(file, from, phone_number_id) {
  try {
    console.log("calling openai");
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });
    console.log(transcription.text);
    await send_message(transcription.text, from, phone_number_id);

    return transcription.text;
  } catch (error) {
    console.log(error);
  }
}
