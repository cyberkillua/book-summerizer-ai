import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriveFromVectorStore } from "./utils/retriver.js";
import { combineDocuments } from "./utils/combineDocument.js";
import { documentPrompt, getSimplePrompt } from "./utils/constants.js";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { send_message } from "./utils/sendMessage.js";
import { insertData } from "./utils/databaseFunctions.js";

import "dotenv/config";
const openAIKey = process.env.OPEN_API_KEY;
const llm = new ChatOpenAI({
  modelName: process.env.MODEL,
  openAIApiKey: openAIKey,
});

export async function docuSummary(
  question,
  senderNumber,
  phone_number_id,
  fileName
) {
  try {
    const standaloneQuestionTemplate = getSimplePrompt;

    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    const answerTemplate = documentPrompt;

    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

    const standaloneQuestionChain = standaloneQuestionPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

    const retriever = await retriveFromVectorStore();

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
      },
      answerChain,
    ]);
    console.log("CALLING CHAIN");

    const response = await chain.invoke({
      question: question,
    });

    await send_message(response, senderNumber, phone_number_id);
    console.log(response);
    const data = {
      user_name: senderNumber,
      summary: response,
      docu_name: fileName,
    };

    await insertData("user_summaries", data);
    return response;
  } catch (error) {
    console.log(error);
  }
}
