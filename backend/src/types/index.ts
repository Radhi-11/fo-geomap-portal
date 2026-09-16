export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  fullName?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'VALIDATOR' | 'VIEWER' | 'TECHNICIAN';
  frontendRole: 'admin' | 'user';
  fullName?: string;
  company?: string;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface BoqItem {
  code?: string;
  name: string;
  qty: number;
  unit: string;
  submittedPrice?: number;
  totalPrice?: number;
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  wo?: string;
  technicianName?: string;
  province?: string;
  city?: string;
  district?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'NEED_REVIEW' | 'VALIDATED' | 'REJECTED' | 'REVISION';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REVISION' | 'REJECTED' | 'ERROR';
  kmzLength?: number;
  boqLength?: number;
  lengthDifference?: number;
  lengthDiffPercentage?: number;
  lengthValidationStatus?: 'MATCH' | 'DIFFERENT' | 'NOT_FOUND' | 'NEED_REVIEW';
  boqTotalValue?: number;
  khsTotalValue?: number;
  totalPriceDifference?: number;
  priceValidationStatus?: 'MATCH' | 'DIFFERENT' | 'NOT_FOUND' | 'NEED_REVIEW';
  overallStatus?: 'MATCH' | 'DIFFERENT' | 'NEED_REVIEW';
  validatorNotes?: string;
  route?: [number, number][];
  boqItems: BoqItem[];
  date: string;
  createdAt: Date;
  updatedAt: Date;
}
