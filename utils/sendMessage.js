import axios from "axios";
const token = process.env.CLOUD_API_ACCESS_TOKEN;

export async function send_message(aiAnswer, senderNumber, phone_number_id) {
  try {
    console.log("Sending message to WhatsApp...");
    if (aiAnswer.length > 4096) {
      aiAnswer = aiAnswer.slice(0, 4093) + "...";
    }

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
        text: { body: aiAnswer },
      },
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  } catch (e) {
    console.log("Error sending message:", e);
  }
}
