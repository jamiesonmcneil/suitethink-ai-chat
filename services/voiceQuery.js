const { getScrapedData } = require('./dataService');
const { getCachedResponse, cacheResponse } = require('./cacheService');

const handleVoiceQuery = async (input, activityId, { getScrapedData, getCachedResponse, cacheResponse, queryAI }) => {
  const startTime = Date.now();
  try {
    if (!input || !activityId || isNaN(parseInt(activityId))) throw new Error('Invalid input or activityId');
    console.log('Voice query:', input);

    const cachedResponse = await getCachedResponse(1, input);
    if (cachedResponse) {
      console.log('Using cached response:', input);
      return cachedResponse;
    }

    const scrapedData = await getScrapedData(1);
    if (!scrapedData.frequent && !scrapedData.infrequent) {
      throw new Error('No unit data available');
    }

    const responseText = await queryAI(input, [], { scrapedData }, 'voice');
    await cacheResponse(1, input, responseText, Date.now() - startTime);

    return responseText;
  } catch (error) {
    console.error('Voice query error:', { message: error.message, stack: error.stack });
    throw error;
  } finally {
    console.log('Voice query completed in', Date.now() - startTime, 'ms');
  }
};

module.exports = {
  handleVoiceQuery: (input, activityId) => handleVoiceQuery(input, activityId, { getScrapedData, getCachedResponse, cacheResponse, queryAI: require('./queryService').queryAI })
};
