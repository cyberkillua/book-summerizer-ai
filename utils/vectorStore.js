import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

import "dotenv/config";

const supaBaseApiKey = process.env.SUPERBASEAPIKEY;
const supaBaseURL = process.env.SUPERBASEURL;
const openAIKey = process.env.OPEN_API_KEY;
const client = createClient(supaBaseURL, supaBaseApiKey);

export async function fileToVector() {
  try {
    const loader = new PDFLoader(
      "/Users/mac/Desktop/projects/my projects/AI stuff/whatsapp/pdfcoffee.com_zonal-marking-michael-cox-pdf-free.pdf"
    );

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      separators: ["\n\n", "\n", " ", ""], // default setting
      chunkOverlap: 50,
    });

    const output = await splitter.splitDocuments(docs);
    console.log("DONE WITH OUTPUT");
    console.log("DONE WITH CLIENT");

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