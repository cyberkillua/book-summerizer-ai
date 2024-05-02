import OpenAI from "openai";
import { send_message } from "./utils/sendMessage.js";
import { findSummary, findBookOrDoc } from "./utils/databaseFunctions.js";
import { textPrompt } from "./utils/constants.js";
import { insertData } from "./utils/databaseFunctions.js";

import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "get_books_in_library",
      description:
        "Get a list of books currently available in the library fot this user",
      parameters: {
        type: "object",
        properties: {
          docu_name: {
            type: "string",
            description: "The name or title of the book to search for",
            default: "",
          },
          user_name: {
            type: "string",
            description: "The username of the user who added the book",
            default: "",
          },
          limit: {
            type: "integer",
            description: "The maximum number of books to return",
            default: 10,
          },
        },
        required: ["user_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_book_summary",
      description: "Get the summary of a book from the database ",
      parameters: {
        type: "object",
        properties: {
          docu_name: {
            type: "string",
            description: "The name or title of the book",
          },
        },
        required: ["docu_name"],
      },
    },
  },
];

export async function getName(userInput) {
  try {
    console.log("getting name...");
    const response = await openai.chat.completions.create({
      model: process.env.MODEL,
      messages: [
        {
          role: "system",
          content: `extract the book name or document name from the ${userInput} 
          and return the book name
          ###
          userInput: Tell me about the atomic habits,
          answer: atomic habits`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.1,
    });
    console.log(response.choices[0].message);
    const bookName = response.choices[0].message.content;
    return bookName;
  } catch (error) {
    console.log(error);
  }
}

export async function ask_ai(userInput, user_name, phone_number_id) {
  try {
    console.log("Asking AI...");

    const conversationArr = [
      {
        role: "system",
        content: textPrompt,
      },
      {
        role: "user",
        content: userInput,
      },
    ];

    const response = await openai.chat.completions.create({
      model: process.env.MODEL,
      messages: conversationArr,
      tools: tools,
      tool_choice: "auto",
      temperature: 0.1,
    });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;
    if (responseMessage.tool_calls) {
      console.log("got the tools...");
      const availableFunctions = {
        get_books_in_library: findSummary,
        get_book_summary: findBookOrDoc,
      };
      conversationArr.push(responseMessage);
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        console.log("this is the function name " + functionName);
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResponse;
        if (functionName === "get_book_summary") {
          functionResponse = await functionToCall(functionArgs.docu_name);
          if (functionResponse.length > 0) {
            console.log(functionResponse[0].summary);
            const toolResponse = functionResponse[0].summary;
            await send_message(toolResponse, user_name, phone_number_id);
            return;
          }
        } else if (functionName === "get_books_in_library") {
          functionResponse = await functionToCall(user_name);
        }
        functionResponse = JSON.stringify(functionResponse, null, 2);
        conversationArr.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResponse,
        });
      }

      const secondResponse = await openai.chat.completions.create({
        model: process.env.MODEL,
        messages: conversationArr,
      });

      const finalResponse = secondResponse.choices[0].message.content;
      console.log(finalResponse);
      const bookName = await getName(userInput);
      const data = {
        user_name: user_name,
        summary: finalResponse,
        docu_name: bookName,
      };

      await insertData("user_summaries", data);
      await send_message(finalResponse, user_name, phone_number_id);
      return;
    } else {
      const response = await openai.chat.completions.create({
        model: process.env.MODEL,
        messages: conversationArr,
      });
      const rep = response.choices[0].message.content;
      await send_message(rep, user_name, phone_number_id);
      return;
    }
  } catch (error) {
    console.log(error);
  }
}
