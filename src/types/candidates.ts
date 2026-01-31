import type { ProductCandidate } from './goals';

// Candidate status in the Digital Workbench
export type CandidateStatus = 'prospect' | 'shortlisted' | 'primary' | 'dismissed';

// Extended candidate with status tracking
export interface ManagedCandidate extends ProductCandidate {
  status: CandidateStatus;
  shortlistedAt?: Date;
  promotedAt?: Date;
  dismissedAt?: Date;
  isNew?: boolean; // For "New Signal" indicator
}

// Scanner mode state
export interface ScannerState {
  isOpen: boolean;
  mode: 'feed' | 'compare';
  prospects: ManagedCandidate[];
  shortlist: ManagedCandidate[];
  primary: ManagedCandidate | null;
}

// Animation states for transitions
export type ScannerAnimation = 
  | 'idle'
  | 'warp-to-shortlist'
  | 'installing-primary'
  | 'syncing';
