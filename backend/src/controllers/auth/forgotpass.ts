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

import asyncHandler from "../../utils/asyncHandler.ts";
import AuthForgotPassword from "./auth.forgotpass.ts";

class ForgotPassword {

    public ForgotPassword = asyncHandler(
        async (req: Request, res: Response) => {
            const { email, otp, newPassword } = req.body;

            if (!email) {
                return res.status(400).json({
                    success : false,
                    message : "email is required",
                });
            }

            const result = await AuthForgotPassword.AuthForgotPassword({
                email,
                otp,
                newPassword,
            });

            return res.status(200).json({
                success : true,
                message : "passwordUpdated" in result
                    ? "Password updated successfully"
                    : "If an account exists for that email, a code has been sent.",
                data    : result,
            });
        }
    )

}

export default new ForgotPassword();