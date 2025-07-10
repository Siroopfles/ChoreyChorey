
export interface Feature {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface Phase {
  name: string;
  description: string;
  features: Feature[];
  nativeFeatures?: Feature[];
}
