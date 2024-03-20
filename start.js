import OpenAI from "openai";
import axios from "axios";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const token = process.env.CLOUD_API_ACCESS_TOKEN;

async function send_message(aiAnswer, senderNumber, phone_number_id) {
  try {
    console.log("Sending message to WhatsApp...");

    axios({
      method: "POST",
      url:
        "https://graph.facebook.com/v12.0/" +
        phone_number_id +
        "/messages?access_token=" +
        token,
      data: {
        messaging_product: "whatsapp",
        to: senderNumber,
        text: { body: aiAnswer },
      },
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.log("Error sending message:", e);
  }
}

export async function ask_ai(userInput, senderNumber, phone_number_id) {
  try {
    console.log("Asking AI...");

    const conversationArr = [
      {
        role: "system",
        content: `Act as a professional book summarizer. Your goal is to help the user understand a book without reading it.
Concentrate on only the most important takeaways and primary points from the book that together will give the user a solid overview and understanding of the book and its topic.
Include all of the following in your summary:
-Main topic or theme of the book
-Key ideas or arguments presented
-All the chapter detailed summaries with the conclusion of the chapter
-Key takeaways from the book
-Comparison to other books on the same subject
-Recommendations of other similar books on the same topic
Your task is to write a thorough yet concise summary of “{{Book name}}" by {{Author}} based on the instructions provided.
OUTPUT: Markdown format with #Headings, ##H2, ###H3, + bullet points, + sub-bullet points
`,
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
    conversationArr.push(response.choices[0].message);
    await send_message(returnedtext, senderNumber, phone_number_id);
    return returnedtext;
  } catch (error) {
    console.log(error);
  }
}

