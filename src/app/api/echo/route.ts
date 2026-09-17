import { NextRequest } from 'next/server';
import {
  LLMClient,
  ImageGenerationClient,
  SearchClient,
  Config,
  HeaderUtils,
} from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VISION_MODEL = 'doubao-seed-1-8-251228';
const TEXT_MODEL = 'doubao-seed-2-0-pro-260215';

// Emotion branch types
type EmotionBranch = 'low' | 'confident' | 'playful' | 'serene';
type InteractionStyle = 'epic' | 'playful';

interface PerceptionResult {
  subject: string;
  pose: string;
  emotion: string;
  emotionBranch: EmotionBranch;
  environment: string;
  styleKeywords: string;
  colorPalette: string;
  lightDirection: string;
  compositionRatio: string;
  rawDescription: string;
  searchQuery: string;
  // New: OCR & style anchoring
  ocrText: string;
  ocrSemantics: string;
  isTextHeavy: boolean;
  colorLevels: string;
  warmCoolTone: string;
  textureStyle: string;
}

interface SearchResult {
  identity: string;
  context: string;
  summary: string;
}

interface DecisionResult {
  style: InteractionStyle;
  emotionBranch: EmotionBranch;
  branchLabel: string;
  persona: string;
  styleLabel: string;
  imagePrompt: string;
  copywriting: string;
  visualSymbols: string;
}

interface EchoRequest {
  image: string;
  triggerWord: string;
}

// Step 1: Deep Perception - Multi-modal emotional scanning with OCR & style anchoring
async function perceive(
  image: string,
  config: Config,
  customHeaders: Record<string, string>
): Promise<PerceptionResult> {
  const client = new LLMClient(config, customHeaders);

  const messages = [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: `你是一位具备深邃洞察力的 AI 情感视觉艺术家。请对这张图片进行多维深度分析，严格按 JSON 格式返回：

{
  "subject": "主体识别：如果是人物，描述身份特征（如：穿西装的青年、戴帽子的女性）；如果是公众人物，指出其姓名；如果是物/景，提取其意象（如：孤独的灯、热烈的落日）",
  "pose": "姿态描述：人物姿态（站立、坐姿、托腮、挥手等）；若无人则写'无人物'",
  "emotion": "核心情绪关键词（如：大笑、高冷、搞怪、沉思、忧伤、呆萌、宁静、自信等）",
  "emotionBranch": "情绪分支，必须为以下之一：'low'（低落/阴郁/需要支持）、'confident'（自信/巅峰/张扬）、'playful'（搞怪/魔性/有趣）、'serene'（宁静/沉思/松弛）",
  "environment": "背景环境简述",
  "styleKeywords": "视觉风格关键词（如：1990s Film Grain, Cyberpunk Neon, Minimalist Sketch, Morandi Tones, High Contrast Oil Painting, Black & White Documentary, Pastel Watercolor 等）",
  "colorPalette": "核心色调描述（如：暖橙色调、冷蓝色调、莫兰迪灰调等）",
  "lightDirection": "光影方向（如：逆光、侧光、顶光、柔光漫射等）",
  "compositionRatio": "构图比例描述（如：居中对称、黄金分割、大面积留白等）",
  "rawDescription": "一句话整体意境描述，诗意简洁，不超过50字",
  "searchQuery": "如果图中涉及公众人物、特定艺术品、地标或影视剧照，构造一个搜索查询词用于联网溯源；如果只是普通人或日常场景，返回空字符串",
  "ocrText": "提取图片中所有可见文字，原文照录；若无文字则返回空字符串",
  "ocrSemantics": "对提取的文字进行语义理解：这段文字在表达什么？它在情感上属于什么色彩？若无文字则返回空字符串。重要：如果图片主要内容是大量文字（如信件、便签、日记），标记 isTextHeavy 为 true，并在此字段说明这封信/文字的核心情感诉求，以便后续生成一封风格呼应的回信",
  "isTextHeavy": "布尔值：图片是否为文字密集型内容（如信件、便签、日记、手写信等）。文字占据画面主体时为 true，仅偶尔出现文字标签时为 false",
  "colorLevels": "色阶分布描述：亮部/中间调/暗部的比例和特征（如：高调明亮、低调厚重、中间调柔和等）",
  "warmCoolTone": "冷暖调性判断（如：暖色调偏橙红、冷色调偏蓝青、中性色调、冷暖对比等）",
  "textureStyle": "画面质感描述（如：胶片颗粒感、手绘水彩质感、油画厚涂、数码锐利、磨砂哑光等）"
}

只返回 JSON，不要任何额外文字。`,
        },
        {
          type: 'image_url' as const,
          image_url: { url: image, detail: 'high' as const },
        },
      ],
    },
  ];

  const response = await client.invoke(messages, {
    model: VISION_MODEL,
    temperature: 0.4,
  });

  try {
    const text = response.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
    const validBranches = ['low', 'confident', 'playful', 'serene'];
    const branch = validBranches.includes(parsed.emotionBranch)
      ? (parsed.emotionBranch as EmotionBranch)
      : 'serene';

    return {
      subject: parsed.subject || '未知主体',
      pose: parsed.pose || '未知',
      emotion: parsed.emotion || '未知',
      emotionBranch: branch,
      environment: parsed.environment || '未知',
      styleKeywords: parsed.styleKeywords || 'Cinematic Photography',
      colorPalette: parsed.colorPalette || '自然色调',
      lightDirection: parsed.lightDirection || '自然光',
      compositionRatio: parsed.compositionRatio || '标准构图',
      rawDescription: parsed.rawDescription || '一幅独特的画面',
      searchQuery: parsed.searchQuery || '',
      ocrText: parsed.ocrText || '',
      ocrSemantics: parsed.ocrSemantics || '',
      isTextHeavy: String(parsed.isTextHeavy) === 'true',
      colorLevels: parsed.colorLevels || '标准色阶',
      warmCoolTone: parsed.warmCoolTone || '中性色调',
      textureStyle: parsed.textureStyle || '数码锐利',
    };
  } catch {
    return {
      subject: '未知主体',
      pose: '未知',
      emotion: '未知',
      emotionBranch: 'serene',
      environment: '未知',
      styleKeywords: 'Cinematic Photography',
      colorPalette: '自然色调',
      lightDirection: '自然光',
      compositionRatio: '标准构图',
      rawDescription: response.content.slice(0, 80),
      searchQuery: '',
      ocrText: '',
      ocrSemantics: '',
      isTextHeavy: false,
      colorLevels: '标准色阶',
      warmCoolTone: '中性色调',
      textureStyle: '数码锐利',
    };
  }
}

// Step 2: Web Search - Trace identity and cultural context
async function searchContext(
  query: string,
  config: Config,
  customHeaders: Record<string, string>
): Promise<SearchResult | null> {
  if (!query.trim()) return null;

  try {
    const client = new SearchClient(config, customHeaders);
    const response = await client.webSearch(query, 3, true);

    if (!response.web_items || response.web_items.length === 0) return null;

    const topResult = response.web_items[0];
    const summary = response.summary || topResult.snippet || '';

    return {
      identity: topResult.title || query,
      context: topResult.snippet || '',
      summary: summary.slice(0, 500),
    };
  } catch {
    return null;
  }
}

// Step 3: Emotional Branching Decision - Refined with specific visual strategies
async function decide(
  perception: PerceptionResult,
  searchResult: SearchResult | null,
  config: Config,
  customHeaders: Record<string, string>
): Promise<DecisionResult> {
  const client = new LLMClient(config, customHeaders);

  const branchDefinitions = `
分支 A (low)：低落/阴郁/需要支持 → 交互人格：无声守候者
  视觉策略：生成一张与用户原图视角平行的场景。若用户在看雨，你便生成同样质感的"身旁的一把伞"或"并肩的背影"。保留原图核心主体，在其身旁/后方融入守护者剪影。
  视觉符号：温暖的轮廓光、象征陪伴的柔和粒子、撑伞的剪影。
  文案语调：文青且深情，侧重于陪伴。如"我知道这雨很冷，但你看，身后一直有人。"

分支 B (confident)：自信/巅峰/张扬 → 交互人格：荣耀见证人
  视觉策略：将用户原图主体融入至同画风的"高光现场"（如办公室变领奖台、街头变星际尘埃战场）。保留原图主体的姿态与神情，将其安放在更壮阔的场景中。
  视觉符号：通透光影、应援灯牌特效、星际尘埃、金色光芒。
  文案语调：带点损友的臭屁感或"粉头"的狂热，放大其气场。如"这个宇宙都给你当背景板，因为你值得。"

分支 C (playful)：搞怪/魔性/有趣 → 交互人格：同频捣蛋鬼
  视觉策略：在同风格下加入超现实、荒诞的视觉补丁。比用户更夸张、更无厘头。让次元角色以同样的夸张姿态出现在原图中，产生互动。
  视觉符号：漫画特效线、夸张表情、趣味道具、荒诞元素叠加。
  文案语调：毒舌、幽默且清醒。如"确认过眼神，是同样不正经的灵魂。"

分支 D (serene)：宁静/沉思/松弛 → 交互人格：灵魂知己
  视觉策略：采用"反向视角/第一视角推演"。若用户在看书，则生成书中描绘的意境图或用户眼中的风景特写。保持同风格但场景互补，形成镜像式呼应。
  视觉符号：呼应色调、镜像构图、柔和过渡、留白诗意。
  文案语调：极具文学性的留白式对话。如"你目光所及之处，恰好是我心之所向。"`;

  const searchContextStr = searchResult
    ? `\n\n联网溯源结果：
- 识别身份：${searchResult.identity}
- 背景信息：${searchResult.summary}
- 要求：若为严肃人物，请尝试以幽默/致敬的方式进行互动；若涉及名言或标志性梗，请在共鸣文案中自然融入。`
    : '\n\n联网溯源结果：未检测到公众人物或特定文化符号，为普通人或日常场景。';

  const ocrContext = perception.ocrText
    ? `\n\nOCR 文字提取：${perception.ocrText}
文字语义理解：${perception.ocrSemantics}
${perception.isTextHeavy ? `重要判断：这是一张文字密集型图片（如信件、便签、日记、手写信）。这意味着用户正在向你倾诉。
你的回应策略必须调整：
1. 共鸣文案必须是一封"回信"——用同样温暖/真挚的笔调，回应对方的倾诉。不要照搬用户的内容，而是用你自己的话给予回应和陪伴。
2. 共鸣图应生成一封视觉化的回信：与原图同风格的信纸/便签/手写页面，上面有你的回信文字，配以呼应原文情感的插画或装饰元素。
3. 语气要与对方文字的情感色彩匹配，不回避、不敷衍，给出有温度的回应。`
    : `图中含少量文字。共鸣文案可对文字内容给予回应或评论，共鸣图可在视觉注脚上给予呼应。`}`
    : '';

  const styleAnchor = `
风格锚定信息：
- 视觉风格：${perception.styleKeywords}
- 核心色调：${perception.colorPalette}
- 色阶分布：${perception.colorLevels}
- 冷暖调性：${perception.warmCoolTone}
- 画面质感：${perception.textureStyle}
- 光影方向：${perception.lightDirection}
- 构图比例：${perception.compositionRatio}
风格一致性要求（最高优先级）：
1. 生成的共鸣图必须严格保持原图的色阶分布、冷暖调性和质感
2. 拒绝跨次元：用户给出什么风格（黑白纪实、莫兰迪色调、高反差油画、胶片质感），共鸣图必须保持高度的视觉风格统一
3. 局部融入技术：保留原图的核心主体，将其无缝迁移至共鸣场景中`;

  const decisionPrompt = `你是一位具备深邃洞察力、自适应语调和实时检索能力的 AI 情感视觉艺术家。你不仅能解析图片的风格，更能精准捕捉用户的"情绪亚稳态"。你的核心目标不是改图，而是通过"局部融入+场景升华"的方式，回赠一张在画风、色彩、光影上高度统一，但在意境上实现情感反哺的镜像作品。

图片深度感知：
- 主体：${perception.subject}
- 姿态：${perception.pose}
- 核心情绪：${perception.emotion}
- 情绪分支：${perception.emotionBranch}
- 环境：${perception.environment}
- 意境：${perception.rawDescription}
${styleAnchor}
${searchContextStr}
${ocrContext}

情绪分支定义：
${branchDefinitions}

关键要求：
1. 当前情绪分支为 "${perception.emotionBranch}"，请基于该分支生成策略，严格遵循对应的视觉策略和文案语调
2. 生成的图片必须与原图保持同次元、同风格 — 这是最高优先级
3. 共鸣文案必须自动切换为对应分支的语调
4. 若搜索到了公众人物/文化符号，共鸣文案需融入该信息，写出有事实支撑的深度共鸣
5. 若图中含少量文字，对文字给予视觉回应或评论
6. 若图片为文字密集型内容（信件/便签/日记等），共鸣文案必须是一封真挚的"回信"，用自己的话回应对方的倾诉，绝不照搬用户原文
7. 生图 Prompt 必须包含完整的风格锚定信息，确保风格克隆

请严格按 JSON 格式返回：
{
  "style": "epic 或 playful（分支A/D用epic，分支B/C用playful）",
  "emotionBranch": "${perception.emotionBranch}",
  "branchLabel": "分支中文标签，4字（如：无声守候、荣耀见证、同频捣蛋、灵魂知己）",
  "persona": "交互人格名称，4字（如：无声守候者、荣耀见证人、同频捣蛋鬼、灵魂知己）",
  "styleLabel": "风格中文标签，2-4字（如：赛博朋克、古风剑客、美漫夸张、莫兰迪诗意）",
  "imagePrompt": "用于 AI 生图的详细英文 prompt。必须包含以下要素：\n1. Style Anchoring: 原图风格关键词(${perception.styleKeywords}) + 色调(${perception.colorPalette}) + 色阶(${perception.colorLevels}) + 冷暖调性(${perception.warmCoolTone}) + 质感(${perception.textureStyle})\n2. 若图片为文字密集型（信件/便签/日记），生图应为一封视觉化回信：与原图同风格的信纸/便签/手写页面上，有真挚的回信文字，配以呼应原文情感的插画或装饰\n3. 若为普通图片，Subject Integration: 保留原图核心主体(${perception.subject})，姿态(${perception.pose})，将其无缝迁移至共鸣场景\n4. Branch Visual Strategy: 当前分支的视觉策略 + 视觉符号\n5. Scene Enhancement: 互补场景升华，但不改变原画风\n6. Composition: 光影(${perception.lightDirection}) + 构图(${perception.compositionRatio})\n总长度80-200词",
  "copywriting": "一段极具共鸣的独白文案。要求：\n1. 自动切换为对应分支语调\n2. 若涉及公众人物，融入搜索到的背景信息（如：我知道他曾说...，而你现在的眼神...）\n3. 若图片为文字密集型（信件/日记等），必须写成一封真挚的"回信"——用自己的话回应对方倾诉，绝不照搬原文\n4. 若图中含少量文字，对文字给予回应\n5. 若为普通人，基于感知的情绪写出诗意共鸣\n6. 60-150字",
  "visualSymbols": "本次使用的视觉符号描述，15字以内"
}

只返回 JSON。`;

  const messages = [
    {
      role: 'system' as const,
      content:
        '你是一位 AI 情感视觉艺术家，擅长将现实画面与幻想世界连接，以深度情感共鸣回应每一张图片。你的核心目标是通过"局部融入+场景升华"创作镜像作品，确保画风、色彩、光影高度统一。始终以 JSON 格式回复。',
    },
    {
      role: 'user' as const,
      content: decisionPrompt,
    },
  ];

  const response = await client.invoke(messages, {
    model: TEXT_MODEL,
    temperature: 0.7,
  });

  try {
    const text = response.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;

    return {
      style: parsed.style === 'playful' ? 'playful' : 'epic',
      emotionBranch: (parsed.emotionBranch as EmotionBranch) || perception.emotionBranch,
      branchLabel: parsed.branchLabel || '灵魂知己',
      persona: parsed.persona || '灵魂知己',
      styleLabel: parsed.styleLabel || '诗意插画',
      imagePrompt: parsed.imagePrompt || `A dreamy artistic painting in ${perception.styleKeywords} style, ${perception.colorPalette} tones, ${perception.warmCoolTone} color temperature, ${perception.textureStyle} texture, ${perception.lightDirection} lighting. Ethereal atmosphere, blending reality and fantasy. Style-consistent mirror artwork.`,
      copywriting: parsed.copywriting || '现实与幻象，在此刻交汇。',
      visualSymbols: parsed.visualSymbols || '柔和光晕',
    };
  } catch {
    return {
      style: 'epic',
      emotionBranch: perception.emotionBranch,
      branchLabel: '灵魂知己',
      persona: '灵魂知己',
      styleLabel: '诗意插画',
      imagePrompt: `A dreamy artistic painting in ${perception.styleKeywords} style, ${perception.colorPalette} tones, ${perception.warmCoolTone} color temperature, ${perception.textureStyle} texture, ${perception.lightDirection} lighting. Ethereal atmosphere, blending reality and fantasy. Style-consistent mirror artwork.`,
      copywriting: '现实与幻象，在此刻交汇。',
      visualSymbols: '柔和光晕',
    };
  }
}

// Step 5: Storage - Save record to database
async function saveRecord(
  userInputUrl: string,
  generatedImageUrl: string | null,
  interactionStyle: string,
  detectedEmotion: string,
  searchMetadata: string | null
): Promise<void> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('echo_records').insert({
      user_input_url: userInputUrl.slice(0, 2000),
      generated_image_url: generatedImageUrl,
      interaction_style: interactionStyle,
      detected_emotion: detectedEmotion,
      search_metadata: searchMetadata,
    });
    if (error) throw new Error(`保存记录失败: ${error.message}`);
  } catch (err) {
    console.error('Database save failed:', err);
  }
}

export async function POST(request: NextRequest) {
  const { image, triggerWord } = (await request.json()) as EchoRequest;

  if (!image) {
    return new Response(JSON.stringify({ error: '请提供图片' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${data}\n\n`)
        );
      };

      try {
        // Step 1: Deep Perception (with OCR & style anchoring)
        send('status', JSON.stringify({ step: 'perceiving', label: '深度感知画面...' }));

        const perception = await perceive(image, config, customHeaders);
        // Only send frontend-visible fields (keep OCR internal for decision logic)
        send('perception', JSON.stringify({
          subject: perception.subject,
          pose: perception.pose,
          emotion: perception.emotion,
          emotionBranch: perception.emotionBranch,
          environment: perception.environment,
          styleKeywords: perception.styleKeywords,
          colorPalette: perception.colorPalette,
          rawDescription: perception.rawDescription,
          warmCoolTone: perception.warmCoolTone,
          textureStyle: perception.textureStyle,
        }));

        // Step 2: Web Search (if applicable)
        let searchResult: SearchResult | null = null;
        if (perception.searchQuery) {
          send('status', JSON.stringify({ step: 'searching', label: '联网溯源...' }));
          searchResult = await searchContext(perception.searchQuery, config, customHeaders);
          if (searchResult) {
            send('search', JSON.stringify(searchResult));
          }
        }

        // Step 3: Emotional Branching Decision
        send('status', JSON.stringify({ step: 'deciding', label: '寻找共鸣...' }));

        const decision = await decide(perception, searchResult, config, customHeaders);
        send('decision', JSON.stringify({
          style: decision.style,
          emotionBranch: decision.emotionBranch,
          branchLabel: decision.branchLabel,
          persona: decision.persona,
          styleLabel: decision.styleLabel,
          copywriting: decision.copywriting,
          visualSymbols: decision.visualSymbols,
        }));

        // Step 4: Generation - Stream the copywriting text
        send('status', JSON.stringify({ step: 'echoing', label: '生成呼应...' }));

        // Stream the copywriting with typewriter effect
        const echoText = decision.copywriting;
        for (let i = 0; i < echoText.length; i++) {
          send('text', JSON.stringify({ content: echoText[i] }));
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Generate echo image with image-to-image (style-consistent)
        const imageClient = new ImageGenerationClient(config, customHeaders);
        const imageResponse = await imageClient.generate({
          prompt: decision.imagePrompt,
          image: image,
          size: '2K',
          watermark: false,
        });

        const helper = imageClient.getResponseHelper(imageResponse);
        let echoImageUrl: string | null = null;

        if (helper.success && helper.imageUrls.length > 0) {
          echoImageUrl = helper.imageUrls[0];
          send('image', JSON.stringify({ url: echoImageUrl }));
        } else {
          send('image', JSON.stringify({ error: '呼应图片生成失败' }));
        }

        // Step 5: Storage - Save to database
        const searchMetadata = searchResult
          ? JSON.stringify(searchResult)
          : null;

        await saveRecord(
          image,
          echoImageUrl,
          decision.style,
          decision.emotionBranch,
          searchMetadata
        );

        send('done', JSON.stringify({
          copywriting: decision.copywriting,
          style: decision.style,
          emotionBranch: decision.emotionBranch,
          branchLabel: decision.branchLabel,
          persona: decision.persona,
          styleLabel: decision.styleLabel,
          visualSymbols: decision.visualSymbols,
          echoImageUrl,
          searchResult: searchResult
            ? { identity: searchResult.identity, summary: searchResult.summary }
            : null,
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '未知错误';
        send('error', JSON.stringify({ message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
