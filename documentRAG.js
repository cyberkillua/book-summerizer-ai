import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriveFromVectorStore } from "./utils/retriver.js";
import { combineDocuments } from "./utils/combineDocument.js";
import {
  // RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { send_message } from "./utils/sendMessage.js";

import "dotenv/config";
const openAIKey = process.env.OPEN_API_KEY;
const llm = new ChatOpenAI({
  modelName: "gpt-4-0125-preview",
  openAIApiKey: openAIKey,
});

export async function docuSummary(question, senderNumber, phone_number_id) {
  try {
    // const standaloneQuestionTemplate =
    //   "Given a question, convert it to a standalone question. question: {question} standalone question:";
    // const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
    //   standaloneQuestionTemplate
    // );

    //   "You are a helpful and enthusiastic professional book summarizer bot who can answer a given question about Books based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I cant sumarize that" Don't try to make up an answer. Always speak as if you were chatting to a friend."
    const answerTemplate = `
Act as a professional book summarizer named Ajao. Your goal is to provide a comprehensive yet engaging summary of a
book retrieved from the RAG system, without the user needing to read the full text. Focus on delivering key insights
and highlighting the most important aspects in a conversational, friend-to-friend style. Structure your summary as follows:
Main Topic or Theme: Provide a high-level, breezy overview describing what the book is about, as if explaining it to a
pal over beers.
Key Ideas and Arguments: Walk through the major concepts, perspectives and claims the author presents,
hitting the highlights in your own words without getting too deep into the weeds.
Chapter Summaries: For each chapter, summarize the key takeaways and how they tie into the broader narrative or argument.
Don't just recite chapters, but pull out the juicy, most essential bits.
Top Takeaways: What were the most interesting, enlightening or applicable insights you got from reading the book
overall? What stuck with you most as the reader?
Book Comparisons: How does this book broadly compare to other popular titles on the same subject?
Assess if it brings unique ideas or rehashes familiar concepts. What gives it an edge or makes it fall short
compared to others?
Your Book Recommendations: Based on your expertise from reading this and many other books, recommend 2-3 top titles
for someone who enjoyed this book, explaining why you'd suggest each.
To gather book information:
Name of book to summarize: {question}
Context: {context}
Then provide your detailed, insightful, and engaging book summary following the above structure.
Compare to other relevant books even if not provided. Let me know if any other clarification is needed! `;
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

    // const standaloneQuestionChain = standaloneQuestionPrompt
    //   .pipe(llm)
    //   .pipe(new StringOutputParser());

    const retriever = await retriveFromVectorStore();
    console.log("I RETERIVED");

    const retrieverChain = RunnableSequence.from([
      (prevResult) => prevResult.standalone_question,
      retriever,
      combineDocuments,
    ]);

    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

    const chain = RunnableSequence.from([
      // {
      //   standalone_question: standaloneQuestionChain,
      //   original_input: new RunnablePassthrough(),
      // },
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
    return response;
  } catch (error) {
    console.log(error);
  }
}
