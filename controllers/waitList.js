import { insertData, checkExist } from "../utils/databaseFunctions.js";

export async function joinWaitList(req, res) {
  try {
    const { email } = req.body;
    const lowercaseEmail = email.toLowerCase();

    const data = { email: lowercaseEmail };
    const emailExist = await checkExist("wait_list", "email", lowercaseEmail);
    if (emailExist.length > 0) {
      res.status(409).json({ error: "This email is already on the wait list" });
      return;
    }
    await insertData("wait_list", data);

    res.status(200).json({ message: "wait list joined" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Request could not be completed",
      error: error.message,
    });
  }
}
