# **App Name**: Credential Verifier

## Core Features:

- Credential Selection: Allow the user to select a verifiable credential to verify from a list of available credentials.
- Format Selection: Allow the user to select the desired format for the verifiable credential (mso_mdoc or dc+sd-jwt).
- Attribute Selection: Enable the user to select specific attributes of the verifiable credential selected.
- API Interaction: Communicate with the backend using the APIs defined in https://github.com/eu-digital-identity-wallet/eudi-srv-web-verifier-endpoint-23220-4-kt to process the credential and attribute selection.
- Data Presentation: Present the selected attributes to the user for review before final submission, providing a summary of what will be shared.

## Style Guidelines:

- Primary color: Deep purple (#663399), echoing the secure and sophisticated feel of Entrust's branding. It will hint at trustworthiness and innovation.
- Background color: Very light grey (#F5F5F5), providing a clean and professional backdrop that ensures readability and reduces visual fatigue. It has the same hue as the primary color, desaturated.
- Accent color: Soft indigo (#4B0082), slightly offset in hue, providing a calm visual cue for interactive elements without overpowering the primary color.
- Font: 'Inter' (sans-serif) for a modern and clean user interface, ensuring optimal readability across all devices. Note: currently only Google Fonts are supported.
- Maintain a structured layout with clear sections for credential selection, format options, and attribute choices, mirroring the organization of the reference image.
- Employ a consistent set of icons to represent different credential types and attributes, enhancing user understanding and interaction.
- Incorporate subtle animations for loading states and transitions to provide feedback and improve the overall user experience.