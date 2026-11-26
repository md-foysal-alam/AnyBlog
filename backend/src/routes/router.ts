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


// src/routes/auth.routes.ts
import { Router } from "express";

import Signup from "../controllers/auth/signup/signup.ts";
import Login from "../controllers/auth/signin/signin.ts";
import Logout from "../controllers/auth/logout/logout.ts";
import verifySession from "../controllers/auth/verifySession/verifySession.ts";

const router = Router();

router.post("/signup", Signup.Signup);
router.post("/signin", Login.Login);
router.post("/logout", Logout.Logout);

// example protected route
router.get("/me", verifySession, (req, res) => {
  res.status(200).json({ success: true, data: (req as any).account });
});

export default router;