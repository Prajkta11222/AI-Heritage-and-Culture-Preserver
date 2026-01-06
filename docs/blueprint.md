# **App Name**: AI Heritage Narrator

## Core Features:

- Image Upload and Storage: Allows users to upload images of heritage sites or old photos. Stores the original image in Firebase Storage and generates a public download URL.
- Image Enhancement: Performs basic image enhancement (brightness, contrast, clarity) on the uploaded image using client-side or server-side logic.
- AI Story Generation: Uses OpenAI Vision to analyze the uploaded image and generate a short, respectful, and educational cultural or memory-based story. Acts as a tool: the model will decide if information should or shouldn't be present based on whether it could identify such context from the image.
- Text-to-Speech Narration: Converts the generated story text into voice narration using OpenAI Text-to-Speech and stores the audio file in Firebase Storage.
- Cultural Context Card: Displays the generated story text along with the original and enhanced images, and includes a 'Cultural Context Card' with era, region, and cultural importance (if known) of the image.
- Play/Pause Audio Narration: Allows users to play and pause the audio narration of the generated story.
- Data Storage: Stores story text and metadata (image URL, enhancement details, story text, audio URL) in Firebase Firestore.

## Style Guidelines:

- Primary color: Soft beige (#F5F5DC) evoking a sense of history and heritage.
- Background color: Light off-white (#F8F8FF) for a clean, unobtrusive backdrop.
- Accent color: Muted brown (#A67B5B) to highlight key elements and call-to-action buttons.
- Body text and Headline font: 'Literata', a transitional serif font suitable for headlines or body text.
- Use simple, outlined icons to represent different actions and categories.
- A clean, single-page layout with a clear visual hierarchy, presenting the original image, enhanced image, story, and audio player in a logical order.
- Subtle transitions and animations for a smooth user experience during image upload, processing, and story generation.