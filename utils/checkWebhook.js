import { createClient } from "@supabase/supabase-js";

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
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error inserting data:", error);
    return false;
  }
}
