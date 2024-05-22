import { insertData } from "../utils/databaseFunctions.js";

export async function joinWaitList(req, res) {
  try {
    const { email } = req.body;
    const data = { email };
    await insertData("wait_list", data);
    res.status(200).json({ message: "wait list joined" });
  } catch (error) {
    console.log(error);
  }
}
