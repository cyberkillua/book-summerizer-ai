# WhatsApp Chatbot with OpenAI Integration

This project implements a WhatsApp chatbot integrated with OpenAI's language model to provide book summaries based on user input. The chatbot listens for incoming messages via a webhook and responds with concise summaries of specified books.

## Features

- Receive incoming messages from WhatsApp webhook
- Process user messages and generate book summaries using OpenAI's GPT-3.5 model
- Send the generated summaries back to the user via WhatsApp

## Installation

1. Clone the repository:

   ```
   git clone <repository_url>
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file in the root directory and provide the following environment variables:

   ```
   WA_PHONE_NUMBER_ID=<your_whatsapp_phone_number_id>
   OPEN_API_KEY=<your_openai_api_key>
   VERIFY_TOKEN=<your_verify_token>
   PORT=<port_number>
   ```

   - `WA_PHONE_NUMBER_ID`: Your WhatsApp phone number ID.
   - `OPEN_API_KEY`: Your OpenAI API key.
   - `VERIFY_TOKEN`: A verification token for validating incoming webhook requests.
   - `PORT`: Port number for running the server (optional, default is 4545).

## Usage

1. Start the server:

   ```
   npm start
   ```

2. Expose the server to the internet:

   Use services like ngrok to expose your local server to the internet. Set up the webhook URL in your WhatsApp API configuration to point to the ngrok URL.

3. Chat with the bot:

   Send messages to your WhatsApp number configured in the chatbot. The bot will respond with book summaries based on the provided input.

## How it Works

- **Webhook Handling**: The server listens for incoming messages via a webhook endpoint (`/webhook`). Upon receiving a message, it triggers the AI conversation process.
- **AI Conversation**: User messages are processed by the OpenAI language model to generate book summaries. The chatbot initiates a conversation with OpenAI's GPT-3.5 model, providing user input as context. The model responds with a concise summary, which is then sent back to the user via WhatsApp.

- **Error Handling**: The application includes error handling mechanisms to catch and log any errors that occur during message processing and AI conversation. Unhandled rejections are also monitored and logged to ensure application stability.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.
