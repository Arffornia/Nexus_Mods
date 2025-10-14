import { generateIndex } from './src/GenerateExternalFiles'
import path from 'path'

async function main() {
    const storageDir = path.join(__dirname, 'externalFiles', 'storage');
    const outputFile = path.join(__dirname, 'externalFiles', 'index.json');
  
    try {
      await generateIndex(storageDir, outputFile);
      console.log('✅ Index generation completed successfully.');
    } catch (error) {
      console.error('❌ Failed to generate index:', error);
      process.exit(1);
    }
  }
  
  main();