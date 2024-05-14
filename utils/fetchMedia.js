import axios from "axios";
import fs from "fs";
import { WritableStreamBuffer } from "stream-buffers";

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

    await new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(FILE_NAME)); // Resolve with the filepath
      writer.on("error", reject);
    });

    console.log(FILE_NAME);
    return FILE_NAME; // Return the filepath
  } catch (error) {
    console.error(error);
    throw error; // Re-throw error to handle it outside this function
  }
}

export async function getAudio(URL) {
  try {
    const audioStream = new WritableStreamBuffer();
    const response = await axios.get(URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "stream",
    });
    response.data.pipe(audioStream);

    await new Promise((resolve, reject) => {
      audioStream.once("end", resolve);
      audioStream.once("error", reject);
    });

    const audioBuffer = audioStream.getContents();
    return audioBuffer;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
