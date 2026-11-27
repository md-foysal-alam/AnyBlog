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

import type { NextFunction, Request, Response } from "express";

import asyncHandler from "../../utils/asyncHandler.ts";
import AuthVerifySession from "./auth.verifySession.ts";

class VerifySession {

    public VerifySession = asyncHandler(
        async (req: Request, _res: Response, next: NextFunction) => {
            const authHeader = req.headers.authorization || "";
            const rawToken   = authHeader.startsWith("Bearer ")
                ? authHeader.slice(7).trim()
                : "";

            const verified = await AuthVerifySession.AuthVerifySession(rawToken);

            (req as any).account   = verified.account;
            (req as any).sessionId = verified.sessionId;

            return next();
        }
    )

}

export default new VerifySession().VerifySession;