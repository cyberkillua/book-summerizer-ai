import axios from "axios";
import fs from "fs";
// import path from "path";

const token = process.env.CLOUD_API_ACCESS_TOKEN;

export async function fetchMediaData(MEDIA_ID) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${MEDIA_ID}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Handle the error here
    console.error(error);
  }
}

export async function getFile(URL, FILE_NAME) {
  try {
    const response = await axios.get(URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "stream",
    });

    const writer = fs.createWriteStream(FILE_NAME);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(error);
  }
}
