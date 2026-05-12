import { BadRequestException } from '@nestjs/common';
import { AccountId } from '@hashgraph/sdk';

/** Canonical form (e.g. leading zeros in the account num are normalized). */
export function canonicalHederaAccountId(raw: string): string {
  const s = raw?.trim();
  if (!s) {
    throw new BadRequestException('Hedera account ID is required');
  }
  try {
    return AccountId.fromString(s).toString();
  } catch {
    throw new BadRequestException(`Invalid Hedera account ID: ${raw}`);
  }
}

/** Values to try in Prisma `in` lookup (DB may store pre-normalization strings). */
export function hederaAccountIdLookupVariants(raw: string): string[] {
  const trimmed = raw?.trim();
  if (!trimmed) {
    throw new BadRequestException('Hedera account ID is required');
  }
  let canonical: string;
  try {
    canonical = AccountId.fromString(trimmed).toString();
  } catch {
    throw new BadRequestException(`Invalid Hedera account ID: ${raw}`);
  }
  const set = new Set<string>([trimmed, canonical]);
  return [...set];
}
