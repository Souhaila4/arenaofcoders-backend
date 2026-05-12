import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RepoExtractorAgent } from './src/agents/repo-extractor.agent';

async function testLinks() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const extractor = app.get(RepoExtractorAgent);

  console.log('--- TEST DU CHECKPOINT 2 ---');
  const urlCP2 = 'https://github.com/Souhaila4/arenaofcodersfrontend-mobile/tree/kaboura';
  console.log(`Lien soumis : ${urlCP2}`);
  // L'URL est normalisée par le backend avant d'être envoyée à l'agent (comme on l'a vu)
  const resultCP2 = await extractor.execute(urlCP2);
  console.log(`L'agent a lu le repository : ${resultCP2.owner}/${resultCP2.repo}`);
  console.log(`Branche analysée par l'agent : ${resultCP2.defaultBranch}`);
  console.log(`Nombre de fichiers trouvés : ${resultCP2.fileCount}`);

  console.log('\n--- TEST DU CHECKPOINT 3 ---');
  const urlCP3 = 'https://github.com/Souhaila4/arenaofcodersfrontend-mobile/tree/negzaoui';
  console.log(`Lien soumis : ${urlCP3}`);
  const resultCP3 = await extractor.execute(urlCP3);
  console.log(`L'agent a lu le repository : ${resultCP3.owner}/${resultCP3.repo}`);
  console.log(`Branche analysée par l'agent : ${resultCP3.defaultBranch}`);
  console.log(`Nombre de fichiers trouvés : ${resultCP3.fileCount}`);

  if (resultCP2.defaultBranch === resultCP3.defaultBranch) {
    console.log('\n❌ CONCLUSION :');
    console.log("L'agent a lu EXACTEMENT LA MÊME BRANCHE pour CP2 et CP3 !");
    console.log("C'est pour cela qu'il n'y a aucune avancée détectée.");
  }

  await app.close();
}

testLinks();
