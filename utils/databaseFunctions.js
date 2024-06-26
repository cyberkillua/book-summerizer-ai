import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supaBaseApiKey = process.env.SUPERBASEAPIKEY;
const supaBaseURL = process.env.SUPERBASEURL;
const supabase = createClient(supaBaseURL, supaBaseApiKey);

export async function checkDataExists(
  tableName,
  filterColumn,
  filterValue,
  filterColumn2,
  filterValue2
) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select()
      .eq(filterColumn, filterValue)
      .eq(filterColumn2, filterValue2)
      .maybeSingle();

    if (error) {
      console.error("Error checking data existence:", error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error("Error checking data existence:", error);
    return false;
  }
}

export async function insertData(tableName, data) {
  try {
    const { error } = await supabase.from(tableName).insert(data);

    if (error) {
      console.error("Error inserting data:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

export async function checkExist(tableName, filterColumn, filterValue) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select()
      .eq(filterColumn, filterValue);

    if (error) {
      console.error("Error checking data existence:", error);
      return false;
    }
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error checking data existence:", error);
    return false;
  }
}

export async function findSummary(user_name) {
  try {
    const { data, error } = await supabase
      .from("user_summaries")
      .select("*")
      .eq("user_name", user_name);
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error checking data existence:", error);
    return false;
  }
}

export async function findBookOrDoc(docu_name) {
  try {
    const { data, error } = await supabase
      .from("user_summaries")
      .select("*")
      .ilike("docu_name", docu_name);
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error checking data existence:", error);
    return false;
  }
}
