export interface ContactContract {
  _id: string;
  phone: string;
  name?: string;
  tags?: string[];
  optedOut: boolean;
  consentGiven: boolean;
  createdAt: string;
}
