export interface MaterialType {
  catID: number;
  nome: string;
  v_compra: number;
  v_venda: number;
}
export type EditMaterialType = {
  catID?: number;
  nome?: string;
  v_compra?: number;
  v_venda?: number;
  status?: boolean;
};
