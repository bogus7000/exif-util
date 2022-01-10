export interface ParsedImage {
  name: string;
  tags: any;
}

export interface ImagePair {
  a: string;
  b: string;
}

export interface ScoringResult {
  accuracy: string;
  incorrectPairs: ImagePair[];
}

export interface PairCandidate {
  name: string;
  deltas: PairCandidateDeltas;
}

export interface PairCandidateDeltas {
  dateTimeDiff?: PairCandidateDelta;
  latitudeDiff?: PairCandidateDelta;
  longitudeDiff?: PairCandidateDelta;
  altitudeDiff?: PairCandidateDelta;
}

export interface PairCandidateDelta {
  within: boolean;
  delta: number;
}
