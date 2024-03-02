const WhatsApp = require("whatsapp");
require("dotenv").config();

const SENDER_NUMBER = process.env.WA_PHONE_NUMBER_ID;
console.log(SENDER_NUMBER);
// Your test sender phone number
const wa = new WhatsApp(SENDER_NUMBER);

// Enter the recipient phone number
const recipient_number = +2348152856528;

async function send_message() {
  try {
    const sent_text_message = wa.messages.text(
      { body: "Hello world" },
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

send_message();
