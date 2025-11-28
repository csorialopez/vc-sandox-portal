"use server";

interface VerificationPayload {
  credentialId: string;
  format: 'mso_mdoc' | 'dc+sd-jwt';
  attributes: string[];
}

export async function submitVerification(payload: VerificationPayload) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log("Simulating API call with payload:", payload);
  
  if (!payload.credentialId || !payload.format || payload.attributes.length === 0) {
      return { success: false, message: "Invalid data provided. Please check your selections." };
  }

  return {
    success: true,
    message: `Presentation for ${payload.attributes.length} attribute(s) has been successfully prepared.`,
  };
}
