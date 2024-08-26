import keywords from './config/keywords.cjs';
import PQueue from 'p-queue';
import dataFetcher from './dataFetcher.js';
import fs from 'fs';
import puppeteerExtra from 'puppeteer-extra';
import { CONCURRENCY_LIMIT, CHECKPOINT_DIRECTORY, OUTPUT_DIRECTORY } from './constants.js';
import { loadCheckpoint } from './methods/checkpointOperations.js';

const concurrencyLimit = CONCURRENCY_LIMIT;
const queue = new PQueue({ concurrency: concurrencyLimit });

if (!fs.existsSync(CHECKPOINT_DIRECTORY)) {
  fs.mkdirSync(CHECKPOINT_DIRECTORY);
}
if (!fs.existsSync(OUTPUT_DIRECTORY)) {
  fs.mkdirSync(OUTPUT_DIRECTORY);
}

const browser = await puppeteerExtra.launch({ headless: false });

for (const category in keywords) {
  for (const item of keywords[category]) {
    const checkpoint = loadCheckpoint(category, item);
    if (checkpoint) {
      if(checkpoint?.isCompleted){
        console.log(`${category} - ${item} is already completed!`)
      }else{
        queue.add(() => dataFetcher(item, category, checkpoint.currentPage, checkpoint.chunk, browser));
      }
    } else {
      queue.add(() => dataFetcher(item, category, 0, 1, browser)); // Start from page 1 and chunk 0
    }
  }
}

queue.onIdle().then(() => {
  console.log('All tasks completed');
  browser.close();
});