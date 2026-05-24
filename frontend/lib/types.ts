export interface Serie {
  id: number;
  nome: string;
  idExterno?: string;
  logoUrl?: string;
}

export interface Colecao {
  id: number;
  nome: string;
  codigoExterno?: string;
  logoUrl?: string;
  totalDeCartas?: number;
  serie?: Serie;
}

export interface Carta {
  id: number;
  nome: string;
  categoria: "POKEMON" | "TREINADOR" | "ENERGIA";
  pontosDeVida?: number;
  imagemUrl?: string;
  idExterno?: string;
  numeroLocal?: string;
  colecao?: Colecao;
}

export interface CartaV2 extends Carta {
  nomeCompleto: string;
}

export interface EntityModel<T> {
  _links?: Record<string, { href: string }>;
  content?: T;
}

export interface Tipo {
  id: number;
  nome: string;
  cartas?: Carta[];
}

export interface DetalheEstatistica {
  id: number;
  raridade?: string;
  artista?: string;
  descricao?: string;
  evolucaoDe?: string;
  carta?: Carta;
}

export interface ApiKeyEntity {
  id: number;
  chave: string;
  nomeCliente: string;
  ativa: boolean;
  criadaEm: string;
}

export interface PageInfo {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface PagedResponse<T> {
  _embedded?: Record<string, T[]>;
  page: PageInfo;
}

export interface ApiError {
  status: number;
  erro: string;
  mensagem: string;
}
