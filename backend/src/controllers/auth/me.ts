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
import AuthMe from "./auth.me.ts";

class Me {

    public Me = asyncHandler(
        async (req: Request, res: Response) => {
            const accountId = (req as any).account?.id;

            if (!accountId) {
                return res.status(401).json({
                    success : false,
                    message : "Unauthorized",
                });
            }

            const dashboard = await AuthMe.AuthMe(accountId);

            return res.status(200).json({
                success : true,
                message : "Dashboard loaded successfully",
                data    : dashboard,
            });
        }
    )

}

export default new Me();