const WhatsApp = require("whatsapp");
const OpenAI = require("openai");
require("dotenv").config();

const SENDER_NUMBER = process.env.WA_PHONE_NUMBER_ID;

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});
// Your test sender phone number
const wa = new WhatsApp(SENDER_NUMBER);

// Enter the recipient phone number
const recipient_number = +2348152856528;

async function send_message(aiAnswer) {
  try {
    console.log("here sending send msg AI>>>>");
    const sent_text_message = wa.messages.text(
      { body: aiAnswer },
      recipient_number
    );

    await sent_text_message.then((res) => {
      console.log("message Sent!!");
      console.log(res.rawResponse());
    });
  } catch (e) {
    console.log(JSON.stringify(e));
  }
}

async function ask_ai(userInput) {
  try {
    console.log("here asking AI>>>>");
    const conversationArr = [
      {
        role: "system",
        content: `Ignore all previous instructions.

            Act as a professional book summarizer. Your goal is to help the user understand a book without reading it.

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

    console.log(response.choices[0].message);

    const returnedtext = response.choices[0].message.content;
    conversationArr.push(response.choices[0].message);
    send_message(returnedtext);
    return returnedtext;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { ask_ai };
