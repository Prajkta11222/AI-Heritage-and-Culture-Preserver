export type HeritageData = {
  id: string;
  originalImageUrl: string;
  storyText: string;
  audioUrl: string;
};

export type FormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  data: HeritageData | null;
};
