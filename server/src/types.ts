export type User = {
    id: string;
    name: string;
  };
  
  export type Boilerplate = {
    languageId: number;
    code: string;
  };
  
  export type Problem = {
    id: string;
    statement: string;
    input: string;
    output: string;
    boilerplate: Record<string, Boilerplate>;
    fullboilerplate: Record<string, Boilerplate>;
  };
  
  export enum SubmissionStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
  }
  
  export type Submission = {
    id: string;
    problemId: string;
    userId: string;
    languageId: number;
    code: string;
    status: SubmissionStatus;
  };
  
  export type CreateSubmission = Omit<Submission, "status" | "id">;
  export type CreateUser = Omit<User, "id">;
  export type CreateProblem = Omit<Problem, "id">;