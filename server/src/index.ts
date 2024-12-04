import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import { problems, submissions, users } from "./data";
import {
  CreateProblem,
  CreateSubmission,
  CreateUser,
  Submission,
  SubmissionStatus,
} from "./types";

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
app.post("/submissions/create", async (req: Request, res: Response) => {
  try {
    const { languageId, code, problemId, userId }: CreateSubmission = req.body;

    if (!languageId || !code || !problemId || !userId) {
      res.status(400).send("Missing parameters");
      return;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    const problem = problems.find((p) => p.id === problemId);
    if (!problem) {
      res.status(404).send("Problem not found");
      return;
    }

    let codeString = problem.fullboilerplate[languageId].code.replace(
      "// Your code here",
      code
    );
    codeString = codeString.replace(
      /const input = .*;/,
      `const input = "${problem.input}"`
    );

    const encodedCode = Buffer.from(codeString).toString("base64");
    const encodedInput = Buffer.from(problem.input).toString("base64");
    const encodedOutput = Buffer.from(problem.output).toString("base64");

    const requestBody = {
      source_code: encodedCode,
      language_id: languageId,
      stdin: encodedInput,
      expected_output: encodedOutput,
    };

    if (!process.env.JUDGE0_API_KEY) {
      console.error("JUDGE0_API_KEY is not set in environment variables");
      res.status(500).send("Internal Server Error");
      return;
    }

    const url =
      "https://judge0-ce.p.rapidapi.com/submissions?fields=*&base64_encoded=true&wait=false";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.JUDGE0_API_KEY,
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      console.error("Error from Judge0 API:", await response.json());
      res.status(502).send("Error processing submission");
      return;
    }

    const result = await response.json();

    const newSubmission: Submission = {
      languageId,
      code,
      problemId,
      userId,
      id: result.token,
      status: SubmissionStatus.PENDING,
    };

    submissions.push(newSubmission);

    res.status(201).json(newSubmission);
  } catch (error) {
    console.log("error submissions/create: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// List all Submissions
app.get("/submissions/all", (req: Request, res: Response) => {
  res.status(200).json(submissions);
});

// Get Submission
app.get("/submissions/:submissionId", async (req: Request, res: Response) => {
  const token = req.params.submissionId;

  const submission = submissions.find((s) => s.id === token);
  if (!submission) {
    res.status(404).json({ message: "Submission not found" });
    return;
  }

  try {
    if (!process.env.JUDGE0_API_KEY) {
      console.error("JUDGE0_API_KEY is not set in environment variables");
      res.status(500).send("Internal Server Error");
      return;
    }

    const url = `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false&fields=*`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.JUDGE0_API_KEY,
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      },
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      console.error("Error from Judge0 API:", await response.json());
      res.status(502).send("Error processing submission");
      return;
    }

    const result = await response.json();

    if (result.status.description === "Accepted") {
      submission.status = SubmissionStatus.ACCEPTED;
    } else if(result.status.description === "In Queue" || result.status.description === "Processing") {
      submission.status = SubmissionStatus.PENDING;
    } else {
      submission.status = SubmissionStatus.REJECTED;
    }

    const resultBody: Submission = {
      languageId: submission.languageId,
      code: submission.code,
      problemId: submission.problemId,
      userId: submission.userId,
      id: token,
      status: submission.status,
    };

    res.status(200).json(resultBody);
  } catch (error) {
    console.log("error submissions/:submissionId: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Reset Application
app.get("/reset", (req: Request, res: Response) => {
  users.length = 0;
  problems.length = 0;
  submissions.length = 0;

  res.status(200).json({ message: "Done" });
});

app.listen(8080, () => {
  console.log("app running on port 8080");
});
