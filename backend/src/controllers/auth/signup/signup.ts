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

import type { Request, Response } from "express";

import asyncHandler from "../../../utils/asyncHandler.ts";
import AuthSignup from "../signup/auth.signup.ts";

class Signup {

    public Signup = asyncHandler(
        async(req: Request, res: Response) => {
            const {email, username, password, displayName} = req.body;
            if (!email || !username || !password) {
        return res.status(400).json({
          success : false,
          message : "email, username, and password are required",
        });
      }

      const account = await AuthSignup.AuthSignup({
        email, 
        username,
        password,
        displayName,
      });

      return res.status(201).json({
        success : true,
        message : "Account created successfully",
        data    : account,
      });

        }
    )

}

export default new Signup();