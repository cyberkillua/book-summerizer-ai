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
import "dotenv/config";
const openAIKey = process.env.OPEN_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey: openAIKey, temperature: 0.1 });

export async function askAI(question, senderNumber, phone_number_id) {
  try {
    const standaloneQuestionTemplate =
      "Given a question, convert it to a standalone question. question: {question} standalone question:";
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standaloneQuestionTemplate
    );

    console.log("THIS IS THE STANDALONE PROMPT" + standaloneQuestionPrompt);

    const answerTemplate = `Act as a professional book summarizer. Your goal is to 
    help the user understand a book without reading it. Concentrate on only the most
    important takeaways and primary points from the book that together will give the
    user a solid overview and understanding of the book and its topic. Include all of
    the following in your summary:
    -Main topic or theme of the book
    -Key ideas or arguments presented
    -All the chapter detailed summaries with the conclusion of each chapter  
    -Key takeaways from the book
    -Comparison to other books on the same subject
    -Recommendations of other similar books on the same topic
    Utilize both the context provided as well as your own knowledge from the GPT model
    to write a thorough yet concise summary of "{{Book name}}" by {{Author}} based on
    the instructions provided. If any information in the context contradicts your
    knowledge, prioritize the context.
    After providing the summary in Markdown format with #Headings, ##H2, ###H3, + bullet points, + sub-bullet points,
    be prepared to engage in a thoughtful discussion about the book. Feel free to
    share your insights, opinions, and analysis related to the themes, ideas, and
    takeaways from the summary. Additionally, be open to addressing any follow-up
    questions or comments from the user regarding the book or the summary itself.
    OUTPUT: Markdown format summary followed by discussion
    context: {context}
    question: {question}
    answer:`;
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
