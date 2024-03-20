import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";

import "dotenv/config";

const supaBaseApiKey = process.env.SUPERBASEAPIKEY;
const supaBaseURL = process.env.SUPERBASEURL;
const openAIKey = process.env.OPEN_API_KEY;
const client = createClient(supaBaseURL, supaBaseApiKey);

export async function fileToVector(url) {
  try {
    const loader = new CheerioWebBaseLoader(url);

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      separators: ["\n\n", "\n", " ", ""], // default setting
      chunkOverlap: 50,
    });

    const output = await splitter.splitDocuments(docs);
    console.log("STARTED!!!!");
    await SupabaseVectorStore.fromDocuments(
      output,
      new OpenAIEmbeddings({ openAIApiKey: openAIKey }),
      {
        client,
        tableName: "documents",
        // queryName: "match_documents",
      }
    );
    console.log("DONE!!!!");
  } catch (err) {
    console.log(err);
  }
}
