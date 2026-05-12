import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  PrivateKey,
  AccountId,
  TopicId,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';

/**
 * Ancrage conformité : envoie sur un topic Hedera Consensus Service (HCS)
 * un message JSON contenant l’id de traçabilité et le SHA-256 du fichier chiffré.
 * Le document reste hors chaîne (chiffré sur disque) ; la chaîne porte l’empreinte + horodatage.
 */
@Injectable()
export class HederaProofAnchorService {
  private readonly logger = new Logger(HederaProofAnchorService.name);

  constructor(private readonly config: ConfigService) {}

  async anchorFundingProof(params: {
    fundingId: string;
    sha256Hex: string;
  }): Promise<string | null> {
    const topicIdStr = this.config.get<string>('HEDERA_PROOF_TOPIC_ID');
    if (!topicIdStr?.trim()) {
      this.logger.warn(
        'HEDERA_PROOF_TOPIC_ID not set — skipping Hedera anchor (create a topic on testnet and set env).',
      );
      return null;
    }

    const accountIdStr = this.config.get<string>('HEDERA_ACCOUNT_ID');
    const privateKeyStr = this.config.get<string>('HEDERA_PRIVATE_KEY');
    if (!accountIdStr || !privateKeyStr) {
      this.logger.warn('HEDERA_ACCOUNT_ID / HEDERA_PRIVATE_KEY missing — skip anchor.');
      return null;
    }

    const operatorId = AccountId.fromString(accountIdStr);
    const operatorKey = PrivateKey.fromStringECDSA(privateKeyStr);
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    const payload = {
      schema: 'arena.funding.proof.v1',
      fundingId: params.fundingId,
      sha256Ciphertext: params.sha256Hex,
      anchoredAt: new Date().toISOString(),
    };
    const message = Buffer.from(JSON.stringify(payload), 'utf8');

    try {
      const tx = await new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(topicIdStr))
        .setMessage(message)
        .freezeWith(client)
        .sign(operatorKey);

      const submit = await tx.execute(client);
      await submit.getReceipt(client);
      client.close();
      const txId = submit.transactionId?.toString() ?? null;
      this.logger.log(`HCS proof anchor submitted: ${txId}`);
      return txId;
    } catch (err: unknown) {
      client.close();
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`HCS anchor failed: ${msg}`);
      return null;
    }
  }
}
