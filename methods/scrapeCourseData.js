export const scrapeCourseData = async (page, course, category, item) => {
  try {
    await page.goto(course.link, { waitUntil: 'load', timeout: 0 });
    await new Promise(resolve => setTimeout(resolve, 8000)); // Allow time for the page to load fully

    const courseData = await page.evaluate((course, category, item) => {
      const keyword = item;
      const getTextContent = (selector) => document.querySelector(selector)?.textContent.trim() || null;
      const getSrc = (selector) => document.querySelector(selector)?.src || null;

      const name = getTextContent('h1.clp-lead__title');
      const image = getSrc('#main-content-anchor img');
      const url = window.location.href;
      const price = course?.price || 'N/A';
      const short_desc = getTextContent('.clp-lead__headline');
      const long_desc = getTextContent('.styles--description--AfVWV');
      const user_rating = getTextContent('.star-rating-module--rating-number--2-qA2');
      const user_rating_count = getTextContent('.clp-lead__element-item--row > a > span:nth-child(2)');
      const language = getTextContent('.clp-lead__locale');
      const total_enrolled = getTextContent('.clp-lead__badge-ratings-enrollment > div');
      const vendor = 'Udemy';
      const level = course?.level || 'N/A';
      const prerequisites = Array.from(document.querySelectorAll('h2.ud-heading-xl.requirements--title--eo3-L + ul li div.ud-block-list-item-content')).map(el => el.textContent.trim());
      const time_to_complete = course?.estimatedTimeElement || 'N/A';
      const provided_by = course?.providedByElement || 'N/A';

      const modules = Array.from(document.querySelectorAll('.accordion-panel-module--panel--Eb0it')).map(el => {
        const moduleName = el.querySelector('.section--section-title-container--Hd9vI > button > span > span')?.textContent || 'No module name';
        const moduleLectureCount = el.querySelector('.section--section-title-container--Hd9vI > button > span > span.section--section-content--2mUJ7')?.textContent || 'No lecture count';
        const lessons = Array.from(el.querySelectorAll('.accordion-panel-module--content--0dD7R')).map(lesson => {
          const lessonName = lesson.querySelector('.section--item-title--EWIuI')?.textContent || '';
          const lessonTime = lesson.querySelector('.section--item-content-summary--Aq9em')?.textContent || '';
          return {
            lessonName,
            lessonTime
          };
        });
        return { moduleName, moduleLectureCount, lessons };
      });

      return {
        name, image, url, price, short_desc, long_desc, user_rating, user_rating_count, language,
        total_enrolled, vendor, prerequisites, level, time_to_complete, category, keyword, provided_by, modules
      };
    }, course, category, item);

    //console.log(courseData);
    return courseData;

  } catch (error) {
    console.error('Error scraping course data:', error);
    return null;
  }
};