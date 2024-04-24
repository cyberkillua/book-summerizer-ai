import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriveFromVectorStore } from "./utils/retriver.js";
import { combineDocuments } from "./utils/combineDocument.js";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { send_message } from "./utils/sendMessage.js";
import { formatConvHistory } from "./utils/formatConvo.js";
import "dotenv/config";
import { textPrompt } from "./utils/constants.js";

const openAIKey = process.env.OPEN_API_KEY;
const llm = new ChatOpenAI({
  modelName: process.env.MODEL,
  openAIApiKey: openAIKey,
  presence_penalty: 0,
  frequency_penalty: 0.3,
  temperature: 0.1,
});
const convoHistory = [];

export async function askAI(question, senderNumber, phone_number_id) {
  try {
    const standaloneQuestionTemplate =
      "Given a question, convert it to a standalone question. question: {question} standalone question:";
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    const answerTemplate = textPrompt;
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

    const standaloneQuestionChain = standaloneQuestionPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

    const retriever = await retriveFromVectorStore();

    console.log("I RETERIVED");
    const retrieverChain = RunnableSequence.from([
      (prevResult) => prevResult.standalone_question,
      retriever,
      combineDocuments,
    ]);

    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

    const chain = RunnableSequence.from([
      {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough(),
      },
      {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question,
        conv_history: ({ original_input }) => original_input.conv_history,
      },
      answerChain,
    ]);
    console.log("CALLING CHAIN");

    const response = await chain.invoke({
      question: question,
      conv_history: formatConvHistory(convoHistory),
    });
    convoHistory.push(question);
    convoHistory.push(response);
    await send_message(response, senderNumber, phone_number_id);

    console.log(response);

    return response;
  } catch (error) {
    console.log(error);
  }
}
