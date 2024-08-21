/* import keywords from './config/keywords.cjs';
import PQueue from 'p-queue';
import dataFetcher from './dataFetcher.js';
import fs from 'fs';

const concurrencyLimit = 5;
const queue = new PQueue({ concurrency: concurrencyLimit });

const loadCheckpoint = () => {
  try {
    const rawData = fs.readFileSync('checkpoint.json');
    return JSON.parse(rawData);
  } catch (error) {
    return null;
  }
};

const checkpoint = loadCheckpoint();

for (const category in keywords) {
  console.log(`Category: ${category}`); // Print the category name

  for (const item of keywords[category]) {
    console.log(`  Item: ${item}`); // Print each item in the array

    if (checkpoint && checkpoint.category === category && checkpoint.item === item) {
      queue.add(() => dataFetcher(item, category, checkpoint.currentPage));
    } else {
      queue.add(() => dataFetcher(item, category));
    }
  }
}

queue.onIdle().then(() => {
  console.log('All tasks completed');
}); */

import keywords from './config/keywords.cjs';
import PQueue from 'p-queue';
import dataFetcher from './dataFetcher.js';
import fs from 'fs';
import path from 'path';

const concurrencyLimit = 5;
const queue = new PQueue({ concurrency: concurrencyLimit });

const checkpointDir = 'checkpoints';

const loadCheckpoint = (category, item) => {
  try {
    const filePath = path.join(checkpointDir, `${category}_${item}.json`);
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath);
      return JSON.parse(rawData);
    }
    return null;
  } catch (error) {
    return null;
  }
};

const saveCheckpoint = (category, item, currentPage) => {
  const checkpoint = { category, item, currentPage };
  const filePath = path.join(checkpointDir, `${category}_${item}.json`);
  fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2));
};

if (!fs.existsSync(checkpointDir)) {
  fs.mkdirSync(checkpointDir);
}

for (const category in keywords) {
  console.log(`Category: ${category}`); // Print the category name

  for (const item of keywords[category]) {
    console.log(`  Item: ${item}`); // Print each item in the array

    const checkpoint = loadCheckpoint(category, item);
    if (checkpoint) {
      queue.add(() => dataFetcher(item, category, checkpoint.currentPage, saveCheckpoint));
    } else {
      queue.add(() => dataFetcher(item, category, 1, saveCheckpoint));
    }
  }
}

queue.onIdle().then(() => {
  console.log('All tasks completed');
});