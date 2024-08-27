import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { scrapeCourseData } from './methods/scrapeCourseData.js';
import { savePageData } from './methods/savePageData.js';
import { urlFriendlyString } from './methods/urlFriendlyString.js';
import { saveCheckpoint } from './methods/checkpointOperations.js';

puppeteerExtra.use(StealthPlugin());

const dataFetcher = async (item, category, startPage, chunk=1, browser) => {
  let currentPage = startPage+1;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });
    /* console.log('Current page URL:', page.url());

    if(currentPage === startPage === 1){
      await page.goto('https://www.udemy.com/', { waitUntil: 'load', timeout: 0 });
      await page.type('input[type=text]', item, { delay: 100 });
      await page.keyboard.press('Enter');
      console.log('Searching for courses...');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 0 });
    }else{
      const nextPageUrl = `https://www.udemy.com/courses/search/?p=${currentPage}&q=${urlFriendlyString(item)}`;
      await page.goto(nextPageUrl, { waitUntil: 'load', timeout: 0 });
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait to ensure the page is fully loaded
      console.log('Current page URL:', page.url());
    } */

    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const url = `https://www.udemy.com/courses/search/?p=${currentPage}&q=${urlFriendlyString(item)}`
        await page.goto(url, { waitUntil: 'load', timeout: 0 });
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait to ensure the page is fully loaded
      } catch (error) {
        console.error('Error navigating to the page:', error);
        hasNextPage = false;
        break;
      }

      console.log(`CATEGORY: ${category} - KEY: ${item} ===> Scraping page ${currentPage}... `);
      let pageData = [];

      let courseLinks = await page.$$eval('.course-card-module--container--3oS-F', (cards) => {
        if (cards.length > 0) {
          return cards.map(card => {
            const linkElement = card.querySelector('.course-card-title-module--title--W49Ap a');
            const levelElement = card.querySelector('.course-card-details-module--course-meta-info--2bDQt span:nth-child(3)');
            const priceElement = card.querySelector('.base-price-text-module--price-part---xQlz span span');
            const estimatedTimeElement = card.querySelector('.course-card-details-module--course-meta-info--2bDQt span:nth-child(1)');
            const providedByElement = card.querySelector('.course-card-instructors-module--instructor-list--cJTfw');

            return {
              link: linkElement ? linkElement.href : null,
              level: levelElement ? levelElement.textContent.trim() : null,
              price: priceElement ? priceElement.textContent.trim() : null,
              estimatedTimeElement: estimatedTimeElement ? estimatedTimeElement.textContent.trim() : null,
              providedByElement: providedByElement ? providedByElement.textContent.trim() : null
            };
          });
        } else {
          return [];
        }
      });

      console.log(`CATEGORY:${category} KEYWORD: ${item} ===> Found ${courseLinks.length} items on page ${currentPage}`);
      if (courseLinks.length === 0){
        hasNextPage = false;
        saveCheckpoint(category, item, currentPage, chunk, true);
        page.close();
        console.log(`No more courses found for ${category} - ${item}. Exiting...`);
        break;
      };

      for (const course of courseLinks) {
        console.log(`Scraping course: ${course.link}`);

        const courseData = await scrapeCourseData(page, course, category, item);

        if (courseData) {
          pageData.push(courseData);
        }

        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 5000) + 5000)); // Random delay between scrapes
      }
      
      savePageData(pageData, category, item, currentPage);
      currentPage++;
    }
    await page.close();
  } catch (error) {
    console.error('Error in dataFetcher:', error);
    saveCheckpoint(category, item, currentPage, chunk, false);
  }
};

export default dataFetcher;