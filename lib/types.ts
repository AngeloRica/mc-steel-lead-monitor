export type LeadCandidate = {
  source: string;
  sourceUrl: string;
  externalId?: string | null;
  title: string;
  body: string;
  authorName?: string | null;
  location?: string | null;
  publishedAt?: string | null;
  isPublic: boolean;
};

export type ContactExtraction = {
  name: string | null;
  emails: string[];
  phones: string[];
};

export type IntentAssessment = {
  score: number;
  qualified: boolean;
  matchedKeywords: string[];
  location: string | null;
};
