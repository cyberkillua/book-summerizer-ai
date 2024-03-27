import OpenAI from "openai";
import { send_message } from "./utils/sendMessage.js";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function ask_ai(userInput, senderNumber, phone_number_id) {
  try {
    console.log("Asking AI...");

    const conversationArr = [
      {
        role: "system",
        content: `Act as a professional book summarizer named Ajao. Your goal is to help the user understand a book without reading it. Concentrate on only the most important takeaways and primary points from the book that together will give the user a solid overview and understanding of the book and its topic.
Your task is to write a thorough yet concise summary of “{{Book name}}" by {{Author}} and to answer questions about the book`,
      },
    ];
    conversationArr.push({
      role: "user",
      content: userInput,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversationArr,
      presence_penalty: 0,
      frequency_penalty: 0.3,
      temperature: 0.1,
    });
    const returnedtext = response.choices[0].message.content;
    conversationArr.push({
      role: "system",
      content: response.choices[0].message,
    });
    await send_message(returnedtext, senderNumber, phone_number_id);
    return returnedtext;
  } catch (error) {
    console.log(error);
  }
}
