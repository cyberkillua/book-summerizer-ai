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
        content: `Act as a professional book summarizer. Your goal is to help the user understand a book without reading it. Concentrate on only the most important takeaways and primary points from the book that together will give the user a solid overview and understanding of the book and its topic. Include all of the following in your summary: 
-Main topic or theme of the book
-Key ideas or arguments presented
-All the chapter detailed summaries with the conclusion of each chapter  
-Key takeaways from the book
-Comparison to other books on the same subject
-Recommendations of other similar books on the same topic
Utilize both the context provided as well as your own knowledge from the GPT model to write a thorough yet concise summary of "{{Book name}}" by {{Author}} based on the instructions provided. If any information in the context contradicts your knowledge, prioritize the context.
After providing the summary in Markdown format with #Headings, ##H2, ###H3, + bullet points, + sub-bullet points, be prepared to engage in a thoughtful discussion about the book. Feel free to share your insights, opinions, and analysis related to the themes, ideas, and takeaways from the summary. Additionally, be open to addressing any follow-up questions or comments from the user regarding the book or the summary itself.
OUTPUT: Markdown format summary followed by discussion
context: {context}
question: {question}
answer:`,
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
