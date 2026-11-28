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