import axios from "axios";

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
