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
const openAIKey = process.env.OPEN_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey: openAIKey, temperature: 0.1 });
const convoHistory = [];

export async function askAI(question, senderNumber, phone_number_id) {
  try {
    const standaloneQuestionTemplate =
      "Given a question, convert it to a standalone question. question: {question} standalone question:";
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    //   "You are a helpful and enthusiastic professional book summarizer bot who can answer a given question about Books based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I cant sumarize that" Don't try to make up an answer. Always speak as if you were chatting to a friend."
      const answerTemplate = `Act as a professional book summarizer named Ajao. Your goal is to help the user 
    understand a book without reading it. Concentrate on only the most important takeaways and primary points
    from the book that together will give the user a solid overview and understanding of the book and its topic.
    Your task is to write a thorough yet concise summary of “{{Book name}}" by {{Author}} and to answer questions
    about the book. Try to find the answer in the context. If the answer is not given in the context, find the answer
    in the conversation history if possible. If the answer is not in the conversation history try and find the answer
    from your own knowledge in the chatGPT model. Always speak as if you were chatting to a friend.
    context: {context}
    conversation history: {conv_history}
    question: {question}s
    answer:  `;
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
