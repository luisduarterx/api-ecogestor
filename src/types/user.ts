export type ReqUser = {
  id: number;
  nome: string;
  cargoID: number;
};
export interface UserData {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cargo: number;
}
export type UserResult = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cargoID: number;
} | null;
export interface CreateUserArgs {
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  cargoID?: number;
}
export interface UserDataAcess {
  email: string;
  senha: string;
}
export interface UserDataEdit {
  id: number;
  data: {
    nome?: string;
    email?: string;
    cargoID?: number;
    telefone?: string;
  };
  //permissions
}
