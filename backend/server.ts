// Copyright 2026 Foysal Alam Rohan

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import compression from "compression";

import router from "./src/routes/router.ts";
import db from "./src/db/db.ts";

import { errorHandler } from "./src/middlewares/errorHandler.ts"; 

dotenv.config();
const app = express();

app.use(morgan("dev"));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/anyblog", router);

db();

app.use(errorHandler); 

app.listen(5000, () => console.log("🚀 anyBlog Server running at http://localhost:5000 ✔"));