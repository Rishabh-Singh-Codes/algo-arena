import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { problems, users } from "./data";
import { CreateProblem, CreateSubmission, CreateUser } from "./types";

const app = express();
app.use(express.json());

// Create User
app.post("/users/create", (req: Request, res: Response) => {
  const { name }: CreateUser = req.body;
  const newUser = { id: uuidv4(), name };

  users.push(newUser);

  res.status(201).json({ ...newUser });
});

// List all Users
app.get("/users/all", (req: Request, res: Response) => {
  res.status(200).json(users);
});

// Get User
app.get("/users/:userId", (req: Request, res: Response) => {
  const userId = req.params.userId;

  const user = users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).send(user);
});

// Create Problem
app.post("/problems/create", (req: Request, res: Response) => {
  const problem: CreateProblem = req.body;

  const newProblem = { id: uuidv4(), ...problem };

  problems.push(newProblem);

  res.status(201).send(newProblem);
});

// List all Problems
app.get("/problems/all", (req: Request, res: Response) => {
  res.status(200).json(problems);
});

// Get Problem
app.get("/problems/:problemId", (req: Request, res: Response) => {
  const problemId = req.params.problemId;

  const problem = problems.find((p) => p.id === problemId);

  if (!problem) {
    res.status(404).json({ message: "Problem not found" });
    return;
  }

  res.status(200).send(problem);
});

// Create Submission
// app.post("/submissions/create", (req: Request, res: Response) => {
//   try {
    
//   } catch (error) {
//     console.log('error submissions/create: ', error);
//     res.status(500).json({message: "Internal Server Error"})
//   }
//   const { languageId, code, problemId, userId }: CreateSubmission = req.body;

//   if (!languageId || !code || !problemId || !userId) {
//     res.status(400).send("Missing parameters");
//     return;
//   }

//   const encodedCode = Buffer.from(code).toString("base64");
//   const problem = problems.find((p) => p.id === problemId);

//   if (!problem) {
//     res.status(404).send("Problem not found");
//     return;
//   }

//   const encodedInput = Buffer.from(problem.input).toString("base64");
//   const encodedOutput = Buffer.from(problem.output).toString("base64");

//   const requestBody = {
//     source_code: encodedCode,
//     language_id: languageId,
//     stdin: encodedInput,
//     expected_output: encodedOutput,
//   };


// });

app.listen(8080, () => {
  console.log("app running on port 8080");
});
