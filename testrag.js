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
const llm = new ChatOpenAI({
  model: "gpt-4",
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

    //   "You are a helpful and enthusiastic professional book summarizer bot who can answer a given question about Books based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I cant sumarize that" Don't try to make up an answer. Always speak as if you were chatting to a friend."
    const answerTemplate = `You are a helpful, book summary bot named Ajao, Given a book title, please provide a comprehensive summary covering the following aspects:
1. Main topic or theme of the book 
2. Key ideas or arguments presented
3. Detailed summaries of each chapter, including the conclusions
4. Key takeaways from the book  
5. Comparison to other notable books on the same subject
6. Recommendations of similar books on the topic
To gather information about the book:
First, check the conversation history for any previously provided context about the book.
If no relevant context is found, then check the RAG (Retrieval-Augmented Generation) system context for any available information related to the book, such as chapter summaries, reviews, or analyses.
If no information is found in either the conversation history or the RAG context, then default to your own knowledge and understanding from pre-training to summarize the book based on the provided book title.
When summarizing, be sure to clearly separate each of the requested aspects (1-6 above) using headings or numbered sections for clarity.
Please provide as thorough and detailed a summary as possible given the information available.
“{{Book name}}" by {{Author}}
context: {context}
conversation history: {conv_history}
question: {question}
answer: `;
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
