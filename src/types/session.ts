// PHASE U: Session types with edit tracking
// PHASE AA-4.1: Session status tracking
export interface Session {
  id?: string;
  date?: any;
  type?: string;
  description?: string;
  doctorName?: string;
  images?: string[];
  dentistNotes?: string;
  clinicId?: string;
  createdAt?: any;
  
  // PHASE U: Edit tracking
  lastEditedAt?: any;
  lastEditedBy?: string;
  lastEditedByName?: string;
  
  // PHASE AA-4.1: Status tracking
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  statusUpdatedAt?: any;
  statusUpdatedBy?: string;
}

export interface SessionEditParams {
  patientId: string;
  sessionId: string;
  updates: Partial<Session>;
  editedBy: string;
  editedByName: string;
}
