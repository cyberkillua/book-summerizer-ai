export function combineDocuments(docs) {
  console.log("2. " + JSON.stringify(docs, null, 2));
  return docs.map((doc) => doc.pageContent).join("\n\n");
}
