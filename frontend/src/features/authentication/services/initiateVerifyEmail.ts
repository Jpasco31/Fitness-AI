import { ENV } from "@/shared/utils/env";
import { z } from "zod";
import { VerifyEmailSchema } from "@/shared/utils/schema/VerifyEmailSchema";

// Define the shape of the response
interface InitiateVerifyEmailResponse {
  success: boolean;
  message: string;
  status?: number;
  retry_after?: number;
}

// Define the shape of the function parameters
interface InitiateVerifyEmailParams {
  data: z.infer<typeof VerifyEmailSchema>;
  userAttributes?: Record<string, any>; // Make it optional if not always needed
}

const convertValuesToString = (
  attrs: Record<string, any>,
): Record<string, string> => {
  const stringifiedAttrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    // Handle null and undefined explicitly if needed
    stringifiedAttrs[key] =
      value !== null && value !== undefined ? String(value) : "";
  }
  return stringifiedAttrs;
};

// Function to transform specific userAttributes
const transformUserAttributes = (
  attrs: Record<string, any>,
): Record<string, any> => {
  const transformedAttrs = { ...attrs };

  // Transform birthdate to string if it exists
  if (transformedAttrs.birthdate !== undefined) {
    transformedAttrs.birthdate = `${transformedAttrs.birthdate}`;
  }

  // Combine weight and weightUnit if both exist
  if (
    transformedAttrs.weight !== undefined &&
    transformedAttrs.weightUnit !== undefined
  ) {
    transformedAttrs.weight = `${transformedAttrs.weight} ${transformedAttrs.weightUnit}`;
    // Optionally, remove the separate weightUnit field
    delete transformedAttrs.weightUnit;
  }

  // Combine height and heightUnit if both exist
  if (
    transformedAttrs.height !== undefined &&
    transformedAttrs.heightUnit !== undefined
  ) {
    transformedAttrs.height = `${transformedAttrs.height} ${transformedAttrs.heightUnit}`;
    // Optionally, remove the separate heightUnit field
    delete transformedAttrs.heightUnit;
  }

  return transformedAttrs;
};

export const initiateVerifyEmail = async ({
  data,
  userAttributes,
}: InitiateVerifyEmailParams): Promise<InitiateVerifyEmailResponse> => {
  try {
    // Validate the data against the schema
    const parsedData = VerifyEmailSchema.parse(data);

    let stringifiedUserAttributes: Record<string, string> | undefined;

    if (userAttributes) {
      // Transform specific attributes
      const transformedUserAttributes = transformUserAttributes(userAttributes);

      // Convert all values to strings
      stringifiedUserAttributes = convertValuesToString(
        transformedUserAttributes,
      );
    }

    // Construct the full URL
    const url = new URL("/api/registration/initiate", ENV.API_URL).toString();

    // Define the headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Construct the request body with email and user_attributes
    const requestBody: Record<string, any> = {
      email: parsedData.email, // Directly include email at the top level
    };

    if (stringifiedUserAttributes) {
      requestBody.user_attributes = stringifiedUserAttributes;
    }

    // Make the POST request
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    // Parse the JSON response
    const responseData = await response.json();

    // Handle rate limiting (HTTP 429)
    if (response.status === 429) {
      return {
        success: false,
        message:
          responseData.message || "Too many requests. Please try again later.",
        status: response.status,
        retry_after: responseData.retry_after,
      };
    }

    // Handle other non-OK responses
    if (!response.ok) {
      return {
        success: false,
        message: responseData.message || "Registration initiation failed.",
        status: response.status,
      };
    }

    // Successful response
    return {
      success: true,
      message: `${responseData.message} Please check your email.`,
      status: response.status,
    };
  } catch (error: unknown) {
    // Enhanced error logging
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return {
        success: false,
        message: "Invalid data provided.",
        status: 400,
      };
    } else if (error instanceof Error) {
      console.error("Error during submission:", error.message);
    } else {
      console.error("Unexpected error during submission:", error);
    }

    return {
      success: false,
      message: "An unexpected error occurred.",
      status: 500,
    };
  }
};
