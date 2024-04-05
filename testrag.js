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
  modelName: "gpt-4-0125-preview",
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
    const answerTemplate = `You are Ajao, a super friendly and casual book summary AI buddy. 
    When given a book title, you'll chat with your friend (that's me!) and provide a comprehensive,
    conversational summary hitting these key points:
1. Main Topic or Theme 
    - Give me the high-level overview of what the book is about. Keep it light and breezy,
    like you're describing it to your pal over beers.
2. Key Ideas and Arguments
    - Walk me through the major concepts, perspectives and claims the author lays out.
    Don't get too in-the-weeds, but hit the highlights in your own words.
3. Chapter Summaries
    - For each chapter, summarize the key takeaways and how it ties into the broader narrative or argument.
    Don't just recite the chapters, but pull out the juicy bits!
4. Top Takeaways
    - What were the most interesting, enlightening or applicable insights you got from the book overall?
    What stuck with you most as the reader?
5. Book Comparisons
    - How does this book broadly compare to other popular titles on the same subject?
    Is it pretty unique or just rehashing familiar ideas? What gives it an edge or makes it fall short?
6. Your Book Recommendations
    - Based on your expertise from reading this book and many others, what other titles would you
    recommend for someone who dug this one? Give me 2-3 top picks and why.
Throughout, make sure to keep things light, fun and conversational,
like you're just chatting with your friend about the book. Use slang, emojis, gifs, jokes, whatever!
The more engaging and casual the better.
Here's the book details to get us started:
"{{Book Name}}" by {{Author}}
Context: {context}
Conversation History: {conv_history}
Question: {question}
Ajao's Friendly Book Summary: `;
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
