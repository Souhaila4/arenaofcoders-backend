/** Raw shapes from Hedera Mirror Node GET /api/v1/transactions (snake_case). */

export interface MirrorTokenTransferRow {
  token_id: string;
  account: string;
  /** Mirror REST may return string or number depending on version / serializer. */
  amount: string | number;
  is_approval?: boolean;
}

export interface MirrorTransactionRow {
  consensus_timestamp: string;
  transaction_id?: string;
  name?: string;
  result?: string;
  token_transfers?: MirrorTokenTransferRow[];
}

export interface MirrorTransactionsResponse {
  transactions?: MirrorTransactionRow[];
  links?: {
    next?: string | null;
  };
}

export interface ArenaMirrorTransferLeg {
  sender: string;
  receiver: string;
  /** Human-readable Arena Coin amount (respects token decimals). */
  amount: number;
  /** Smallest units as string (always positive for the leg). */
  amountRaw: string;
}

export interface ArenaMirrorTransactionItem {
  transactionId: string | null;
  consensusTimestamp: string;
  consensusAtIso: string;
  type: string | null;
  result: string | null;
  transfers: ArenaMirrorTransferLeg[];
  /** Unpaired token rows for this token when sender/receiver pairing is ambiguous. */
  rawTokenLegs?: Array<{
    account: string;
    amount: number;
    amountRaw: string;
  }>;
}

export interface AdminMirrorArenaTransactionsResult {
  source: 'hedera-mirror';
  strategy: string;
  mirrorBaseUrl: string;
  treasuryAccountId: string;
  tokenId: string;
  decimals: number;
  transactions: ArenaMirrorTransactionItem[];
  links: { next: string | null };
}
