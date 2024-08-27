import fs from 'fs';
import path from 'path';
import { CHUNK_LIMIT } from '../constants.js';
import { saveCheckpoint, loadCheckpoint } from './checkpointOperations.js';

function readExistingData(fileName) {
  try {
    const fileRawData = fs.readFileSync(fileName);
    return fileRawData ? JSON.parse(fileRawData) : [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File does not exist, return an empty array
      return [];
    } else {
      // Re-throw other errors
      throw err;
    }
  }
}

export const savePageData = (pageData, category, item, currentPage) => {
  const checkpoint = loadCheckpoint(category, item);
  const chunkLimit = CHUNK_LIMIT;
  const chunk = checkpoint?.chunk || 1;
  const fileName = path.join('output', `${category}_${item}_chunk_${chunk}.json`);
  const existingData = readExistingData(fileName);

  if (existingData.length + pageData.length > chunkLimit) {
    const remainingData = chunkLimit - existingData.length;
    const slicedData = pageData.slice(0, remainingData); // Remove excess data to fit within chunk limit
    const newData = pageData.slice(remainingData);
    const nextChunk = chunk + 1;
    const nextFileName = path.join('output', `${category}_${item}_chunk_${nextChunk}.json`);

    // commplete the earlier chunk data
    fs.writeFileSync(fileName, JSON.stringify([...existingData, ...slicedData], null, 2));

    // save rest of the data as the next chunk data
    fs.writeFileSync(nextFileName, JSON.stringify(newData, null, 2), (err) => {
      if (err) throw err;
    });

    // update the checkpoint file
    saveCheckpoint(category, item, currentPage, nextChunk, false);
  } else {
    const combinedData = [...existingData, ...pageData];
    // update the chunk file
    fs.writeFileSync(fileName, JSON.stringify(combinedData, null, 2, (err, data)  => {
      if (err) throw err;
    }));
    // update the checkpoint file
    saveCheckpoint(category, item, currentPage, chunk, false);
  }
}