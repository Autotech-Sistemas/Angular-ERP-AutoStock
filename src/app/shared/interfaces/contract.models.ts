import { Links } from './common.models';
import { SaleResponseDTO } from './sale.models';

export type PaymentTerms =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'CHECK'
  | 'INSTALLMENTS_WITHOUT_INTEREST'
  | 'INSTALLMENTS_WITH_INTEREST'
  | 'FINANCED_BY_BANK'
  | 'FINANCED_BY_DEALERSHIP'
  | 'TRADE_IN'
  | 'PARTIAL_CASH_PARTIAL_FINANCING'
  | 'OTHER';

export type ContractStatus = 'SIGNED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

export interface ContractRequest {
  contractNumber: string;
  contractType: string;
  contractDate: string;
  deliveryDate: string;
  totalAmount: number;
  paymentTerms: PaymentTerms;
  contractStatus?: ContractStatus;
  notes?: string;
  attachments?: string;
  saleId: string;
}

export interface ContractPatchRequest {
  contractStatus?: ContractStatus;
  notes?: string;
  deliveryDate?: string;
}

export interface ContractResponseDTO {
  id?: string;
  contractNumber?: string;
  contractType?: string;
  contractDate?: string;
  deliveryDate?: string;
  totalAmount?: number;
  paymentTerms?: PaymentTerms;
  contractStatus?: ContractStatus;
  notes?: string;
  attachments?: string;
  sale?: SaleResponseDTO;
  _links?: Links;
}
