const OpenAI = require('openai');
const occupations = require('../data/occupations.json');
const deaths = require('../data/deaths.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getRandomYear(era) {
  const eraRanges = {
    '선사': [-150000, -3000],
    '고대': [-3000, 476],
    '삼국시대(기원전57~935)': [-57, 935],
    '고려(918~1392)': [918, 1392],
    '조선(1392~1897)': [1392, 1897],
    '중세': [476, 1453],
    '근세': [1453, 1789],
    '근대': [1789, 1914],
    '현대': [1914, 1980],
    'any': [-150000, 1980]
  };
  const [min, max] = eraRanges[era] || eraRanges['any'];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatYear(year) {
  if (year < 0) return `기원전 ${Math.abs(year)}년`;
  return `${year}년`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '이름을 입력해주세요.' });
  }

  const occupation = occupations[Math.floor(Math.random() * occupations.length)];
  const death = deaths[Math.floor(Math.random() * deaths.length)];
  const year = getRandomYear(occupation.era);
  const yearStr = formatYear(year);

  const prompt = `당신은 전생 스토리텔러입니다. 아래 정보를 바탕으로 재미있고 흥미진진한 전생 이야기를 한국어로 만들어주세요.
유머러스하면서도 드라마틱하게, 마치 실제 역사인 것처럼 생생하게 묘사해주세요.
이름이 현대 한국 이름이더라도 전생의 이름인 것처럼 자연스럽게 녹여주세요.
만약 직업이 동물, 무생물, 미생물, 외계인 등 비인간적 존재라면 그에 맞게 유머러스하게 서술해주세요.

- 이름: ${name}
- 전생 시기: ${yearStr}
- 전생 직업/존재: ${occupation.name}
- 사망 원인: ${death}

3~4문단, 총 200~300자 내외로 작성해주세요. 마지막에 교훈이나 웃긴 한마디를 덧붙여주세요.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 1.0
    });

    const story = completion.choices[0].message.content;

    res.json({
      name,
      year: yearStr,
      occupation: occupation.name,
      death,
      story
    });
  } catch (err) {
    console.error('OpenAI API error:', err.message);
    res.status(500).json({ error: 'AI 스토리 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' });
  }
};
