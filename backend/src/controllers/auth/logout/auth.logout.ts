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

import crypto from"crypto";
import { eq} from "drizzle-orm";

import {db} from "../../../db/db.ts";
import { sessions } from "../../../models/schema.ts";

class AuthLogout {

    private hashToken(rawToken: string): string {
        return crypto.createHash("sha256").update(rawToken).digest("hex");
    }

    public async AuthLogout(rawToken: string) {
        
        if (!rawToken) 
        return;

        const tokenHash = this.hashToken(rawToken);

        await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .returning({ id: sessions.id });

    }

}

export default new AuthLogout();