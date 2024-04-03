import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

import "dotenv/config";

const supaBaseApiKey = process.env.SUPERBASEAPIKEY;
const supaBaseURL = process.env.SUPERBASEURL;
const openAIKey = process.env.OPEN_API_KEY;
const client = createClient(supaBaseURL, supaBaseApiKey);

export async function retriveFromVectorStore() {
  try {
    const vectorStore = new SupabaseVectorStore(
      new OpenAIEmbeddings({ openAIApiKey: openAIKey }),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      }
    );

    const retriever = vectorStore.asRetriever({ relevanceScoreThreshold: 0.5 });

    return retriever;
  } catch (error) {
    console.log(error);
  }
}
