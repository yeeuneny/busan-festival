const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'POST 요청만 허용됩니다.',
      }),
    }
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다.',
      }),
    }
  }

  try {
    const requestBody = JSON.parse(event.body || '{}')

    if (!Array.isArray(requestBody.messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'messages 배열이 필요합니다.',
        }),
      }
    }

    const openAIResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: requestBody.model || 'gpt-4o-mini',
          messages: requestBody.messages,
          temperature: requestBody.temperature ?? 0.7,
        }),
      },
    )

    const responseText = await openAIResponse.text()

    return {
      statusCode: openAIResponse.status,
      headers,
      body: responseText,
    }
  } catch (error) {
    console.error('OpenAI function error:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'OpenAI 요청 처리 중 오류가 발생했습니다.',
        detail: error.message,
      }),
    }
  }
}

module.exports = { handler }