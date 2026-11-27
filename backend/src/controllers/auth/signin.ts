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
import AuthSignin from "./auth.signin.ts";

class Signin {

    public Signin = asyncHandler(
        async (req: Request, res: Response) => {
            const { email, username, identifier, password } = req.body;
            const loginId = identifier || email || username;

            if (!loginId || !password) {
                return res.status(400).json({
                    success : false,
                    message : "identifier (email/username) and password are required",
                });
            }

            const result = await AuthSignin.AuthSignin({
                identifier : loginId,
                password,
            });

            return res.status(200).json({
                success : true,
                message : "Verification code sent to your email.",
                data    : result,
            });
        }
    )

    public VerifySigninOtp = asyncHandler(
        async (req: Request, res: Response) => {
            const { email, username, identifier, otp } = req.body;
            const loginId = identifier || email || username;

            if (!loginId || !otp) {
                return res.status(400).json({
                    success : false,
                    message : "identifier (email/username) and otp are required",
                });
            }

            const result = await AuthSignin.VerifySigninOtp({
                identifier : loginId,
                otp,
                userAgent  : req.headers["user-agent"],
                ipAddress  : req.ip,
            });

            return res.status(200).json({
                success : true,
                message : "Signed in successfully",
                data    : {
                    token     : result.token,
                    expiresAt : result.session.expiresAt,
                    account   : result.account,
                },
            });
        }
    )

}

export default new Signin();