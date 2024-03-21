import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriveFromVectorStore } from "./utils/retriver.js";
import { combineDocuments } from "./utils/combineDocument.js";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import "dotenv/config";
const openAIKey = process.env.OPEN_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey: openAIKey, temperature: 0.1 });

export async function askAI() {
  try {
    console.log("I AM HERE");
    const standaloneQuestionTemplate =
      "Given a question, convert it to a standalone question. question: {question} standalone question:";
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    //   "You are a helpful and enthusiastic professional book summarizer bot who can answer a given question about Books based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I cant sumarize that" Don't try to make up an answer. Always speak as if you were chatting to a friend."
    const answerTemplate = `Act as a professional book summarizer. Your goal is to help the user understand a book without reading it. Concentrate
on only the most important takeaways and primary points from the book that together will give the user a solid overview
and understanding of the book and its topic. Include all of the following in your summary: -Main topic or theme of the
book -Key ideas or arguments presented -All the chapter detailed summaries with the conclusion of the chapter -Key takeaways
from the book -Comparison to other books on the same subject -Recommendations of other similar books on the same topic
Utilize both the context provided as well as your own knowledge from the GPT model to write a thorough yet concise
summary of "{{Book name}}" by {{Author}} based on the instructions provided. If any information in the context contradicts
your knowledge, prioritize the context.
OUTPUT: Markdown format with #Headings, ##H2, ###H3, + bullet points, + sub-bullet points
context: {context}
question: {question}
answer: `;
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

    const standaloneQuestionChain = standaloneQuestionPrompt
      .pipe(llm)
      .pipe(new StringOutputParser());

    console.log("WANNA RETERIVE");

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
      },
      answerChain,
    ]);
    console.log("CALLING CHAIN");
    const response = await chain.invoke({
      question: `summarize never-split-the-difference for me based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I cant sumarize that" Don't try to make up an answer. `,
    });

    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

askAI();
