export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const imageUrl = query.url as string;

  if (!imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: "URL is required",
    });
  }

  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw createError({
         statusCode: response.status,
         statusMessage: 'Failed to fetch image from external URL'
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    
    // Allow any origin for the proxy
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    // Return the raw buffer
    return new Response(arrayBuffer, {
       status: 200,
       headers
    });
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error fetching proxy image: " + err.message,
    });
  }
});
