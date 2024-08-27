import fs from 'fs';
import path from 'path';
import { CHECKPOINT_DIRECTORY } from '../constants.js';

export const loadCheckpoint = (category, item) => {
    try {
        const filePath = path.join(CHECKPOINT_DIRECTORY, `${category}_${item}.json`);
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath);
            return JSON.parse(rawData);
        }
        return null;
    } catch (error) {
        return null;
    }
  };
  
export const saveCheckpoint = (category, item, currentPage, chunk, isCompleted) => {
    const checkpoint = { category, item, currentPage, chunk, isCompleted };
    const filePath = path.join(CHECKPOINT_DIRECTORY, `${category}_${item}.json`);
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2));
};