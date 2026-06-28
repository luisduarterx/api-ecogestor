export interface MaterialType {
  catID: number;
  nome: string;
  preco_compra: number;
  preco_venda: number;
}
export type EditMaterialType = {
  catID?: number;
  nome?: string;
  preco_compra?: number;
  preco_venda?: number;
  status?: boolean;
};
