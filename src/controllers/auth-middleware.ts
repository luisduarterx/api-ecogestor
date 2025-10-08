import { ExtendedRequest } from "../types/extended-request";
import { Response, NextFunction } from "express";
import { userHasPermission } from "../model/users";

export function authorize(requiredPermissions: string) {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userPermission = await userHasPermission(
        req.user?.id,
        requiredPermissions
      );
      if (!userPermission) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
