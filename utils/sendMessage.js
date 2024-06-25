import axios from "axios";
import { splitMessage } from "./splitMessages";
const token = process.env.CLOUD_API_ACCESS_TOKEN;

export async function send_message(aiAnswer, senderNumber, phone_number_id) {
  try {
    console.log("Sending message to WhatsApp...");
    let messagesToSend;
    if (aiAnswer.length > 4096) {
      messagesToSend = splitMessage(aiAnswer, 4000);
    } else {
      messagesToSend = [aiAnswer];
    }
    let index = 0;
    for (const message of messagesToSend) {
      index = index + 1;
      console.log(`sending message number ${index}`);
      const response = await axios({
        method: "POST",
        url:
          "https://graph.facebook.com/v12.0/" +
          phone_number_id +
          "/messages?access_token=" +
          token,
        data: {
          messaging_product: "whatsapp",
          to: senderNumber,
          text: { body: message },
        },
        headers: { "Content-Type": "application/json" },
      });

      return response.data;
    }
  } catch (e) {
    console.log("Error sending message:", e);
  }
}
