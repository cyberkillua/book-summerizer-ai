import WhatsApp from "whatsapp";
import OpenAI from "openai";

import "dotenv/config";

const SUMMARIZER_AI_NUMBER = process.env.WA_PHONE_NUMBER_ID;

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const wa = new WhatsApp(SUMMARIZER_AI_NUMBER);

async function send_message(aiAnswer, senderNumber) {
  try {
    console.log("Sending message to WhatsApp...");

    const sent_text_message = wa.messages.text(
      { body: aiAnswer },
      senderNumber
    );

    await sent_text_message.then(() => {
      console.log("Message sent successfully!");
      //   console.log(res.rawResponse());
    });
  } catch (e) {
    console.log(JSON.stringify(e));
  }
}

export async function ask_ai(userInput, senderNumber) {
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
    await send_message(returnedtext, senderNumber);
    return returnedtext;
  } catch (error) {
    console.log(error);
  }
}
