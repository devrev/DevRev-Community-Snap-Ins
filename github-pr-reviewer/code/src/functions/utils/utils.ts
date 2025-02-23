import axios from "axios";

export function convertToJson(payload: string): {} {
  try {
    return JSON.parse(payload);
  } catch (error) {
    console.error("Error converting to JSON:", error);
    return {};
  }
}

export type HTTPResponse = {
  success: boolean;
  errMessage: string;
  data: any;
};

export async function makeAPICall(
  endpoint: string,
  payload: any,
  authKey: string,
  method: string = "GET"
): Promise<HTTPResponse> {
  try {
    const res: HTTPResponse = await axios.request({
      url: endpoint,
      method: method,
      headers: {
        Authorization: authKey,
        "Content-type": "application/json",
      },
      data: payload,
    });
    return {
      success: true,
      errMessage: "Data successfully fetched",
      data: res.data,
    };
  } catch (error: any) {
    const errorMessage = error.response?.data || error.request?.data || error;
    return { success: false, errMessage: errorMessage, data: "" };
  }
}

export function processPRDiff(prDiff: string): string {
  const diffLines = prDiff.split("\n");
  let lineNumber = 0;
  let currentFile = "";

  return diffLines
    .map((line) => {
      if (
        line.startsWith("diff --git") ||
        line.startsWith("+++") ||
        line.startsWith("---")
      ) {
        currentFile = line;
        return line;
      }
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          lineNumber = parseInt(match[1]) - 1;
        }
        return line;
      }
      if (line.startsWith("\\ No newline at end of file")) {
        lineNumber++;
        return `${lineNumber - 1}|${line}`;
      }
      if (!line.startsWith("-")) {
        lineNumber++;
        return `${lineNumber}|${line}`;
      }
      return line;
    })
    .join("\n");
}
