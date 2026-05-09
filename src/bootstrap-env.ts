/**
 * Premier import de main.ts : charge .env avant AppModule (DynamicModule / file Bull).
 * Utilise le répertoire du projet (parent de dist/ ou src/) en plus du cwd, car
 * le serveur peut être lancé avec un cwd parent (fichier .env introuvable autrement).
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const projectRootEnv = path.join(__dirname, '..', '.env');
const cwdEnv = path.join(process.cwd(), '.env');

const pathsToTry = [cwdEnv, projectRootEnv].filter(
  (p, i, arr) => fs.existsSync(p) && arr.indexOf(p) === i,
);

let totalKeys = 0;
for (const envPath of pathsToTry) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('[bootstrap-env]', envPath, result.error.message);
  } else {
    const n = Object.keys(result.parsed || {}).length;
    totalKeys += n;
    console.log(
      '[bootstrap-env]',
      n,
      'keys from',
      envPath,
    );
  }
}
if (pathsToTry.length === 0) {
  console.error(
    '[bootstrap-env] Aucun .env trouvé (cwd:',
    process.cwd(),
    'ou',
    projectRootEnv,
    ')',
  );
} else {
  console.log(
    '[bootstrap-env] total ~',
    totalKeys,
    'PROOF_ENCRYPTION_KEY=',
    process.env.PROOF_ENCRYPTION_KEY ? 'défini' : 'absent',
  );
}
