import { Request } from "express";
import { ReqUser, UserData } from "./user";

export type ExtendedRequest = Request & {
  user?: ReqUser;
};
