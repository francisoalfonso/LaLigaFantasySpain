# 📘 API REFERENCE VEO3 - FANTASY LA LIGA

## 🎯 REFERENCIA TÉCNICA COMPLETA

### **KIE.ai VEO3 API Endpoints**

#### **Base URL**
```
https://api.kie.ai/api/v1/veo/
```

#### **Authentication**
```javascript
headers: {
  'Authorization': `Bearer ${KIE_AI_API_KEY}`,
  'Content-Type': 'application/json'
}
```

---

## 🚀 **ENDPOINT: GENERATE VIDEO**

### **POST** `/generate`

#### **Request Body**
```javascript
{
  "prompt": "Medium shot, professional broadcast style. A 32-year-old Spanish sports analyst...",
  "imageUrls": ["https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg"],
  "model": "veo3_fast",
  "aspectRatio": "9:16",
  "seed": 30001,
  "waterMark": "Fantasy La Liga Pro",
  "enableTranslation": true,
  "enableFallback": true
}
```

#### **Response Success (200)**
```javascript
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "a1b2c3d4e5f6g7h8i9j0",
    "status": "pending"
  }
}
```

#### **Response Error**
```javascript
{
  "code": 400,
  "msg": "Your prompt was flagged by Website as violating content policies",
  "data": null
}
```

---

## 📊 **ENDPOINT: CHECK STATUS**

### **GET** `/record-info?taskId={taskId}`

#### **Response Processing (successFlag: 0)**
```javascript
{
  "code": 200,
  "data": {
    "successFlag": 0,
    "taskId": "a1b2c3d4e5f6g7h8i9j0",
    "response": null
  }
}
```

#### **Response Complete (successFlag: 1)**
```javascript
{
  "code": 200,
  "data": {
    "successFlag": 1,
    "taskId": "a1b2c3d4e5f6g7h8i9j0",
    "response": {
      "resultUrls": [
        "https://tempfile.aiquickdraw.com/s/video-id_watermarked.mp4"
      ],
      "duration": 8.15,
      "cost": 0.30
    }
  }
}
```

#### **Response Failed (successFlag: 2+)**
```javascript
{
  "code": 200,
  "data": {
    "successFlag": 2,
    "taskId": "a1b2c3d4e5f6g7h8i9j0",
    "errorMessage": "Content policy violation",
    "response": null
  }
}
```

---

## 🎭 **ANA REAL CONFIGURATION**

### **Ana Character Bible (EXACT)**
```javascript
const ANA_CHARACTER_BIBLE = "A 32-year-old Spanish sports analyst with short black curly hair styled in a professional ponytail, warm brown eyes, athletic build, wearing a navy blue sports blazer with subtle La Liga branding. Confident posture, natural hand gestures for emphasis, professional broadcaster energy";
```

### **Ana Image URL**
```javascript
const ANA_IMAGE_URL = "https://raw.githubusercontent.com/laligafantasyspainpro-ux/imagenes-presentadores/main/ana-main/Ana-001.jpeg";
```

### **Ana Default Parameters**
```javascript
const ANA_DEFAULT_PARAMS = {
  imageUrls: [ANA_IMAGE_URL],
  model: "veo3_fast",
  aspectRatio: "9:16",
  seed: 30001,
  waterMark: "Fantasy La Liga Pro",
  enableTranslation: true,
  enableFallback: true
};
```

---

## 🎬 **PROMPT TEMPLATES**

### **Template Base**
```javascript
const PROMPT_TEMPLATE = `
${CAMERA_SHOT} ${VISUAL_STYLE}. ${ANA_CHARACTER_BIBLE}. In ${STUDIO_DESCRIPTION}, ${LIGHTING_DESCRIPTION}. Ana ${EMOTIONAL_DIRECTION}, speaking directly to camera in Spanish with Madrid accent: "${SPANISH_DIALOGUE}". ${AUDIO_ENVIRONMENT}. Ana maintains direct eye contact with camera, ending in neutral position ready for seamless transition. Professional sports broadcast standard, perfect consistency with reference image.
`;
```

### **Chollo Revelation Template**
```javascript
const CHOLLO_PROMPT = `
Medium shot with dynamic energy building, cinematic broadcast style. ${ANA_CHARACTER_BIBLE}. In modern Fantasy La Liga studio with dramatic lighting creating excitement and intrigue, multiple screens showing mysterious player statistics. Ana (intimate whisper) starts conspiratorially then (building tension) builds dramatic tension before (explosive excitement) explosive revelation, speaking directly to camera in Spanish with Madrid accent with voice modulating from whisper to excited shout: "(intimate whisper) ¡Misters... (building tension) he descubierto algo que... (explosive excitement) ¡Es INCREÍBLE! (urgent command) ¡Preparaos para el chollo del SIGLO!" Dynamic sports broadcast ambiance with tension-building audio cues, rising musical sting. Ana maintains direct eye contact, ending in neutral position ready for seamless transition. Professional sports broadcast standard, perfect consistency with reference image.
`;
```

### **Data Analysis Template**
```javascript
const ANALYSIS_PROMPT = `
Close-up shot with analytical focus shifting to excitement, professional broadcast style. ${ANA_CHARACTER_BIBLE}. In tactical analysis studio with ${PLAYER_NAME} statistics prominently displayed, focused lighting creating authority and conviction. Ana (measured analytical confidence) begins with analytical confidence then (building conviction) builds conviction through data before (authoritative conclusion) explosive statistical revelation, speaking directly to camera in Spanish with Madrid accent with voice modulating from measured analysis to confident authority: "(measured analytical confidence) ${PLAYER_NAME}... (building conviction) los números son... (authoritative conclusion) ¡ESPECTACULARES! (commanding authority) ${PRICE} por este nivel... ¡Es MATEMÁTICA pura!" Professional studio ambiance with data processing sounds building to statistical triumph. Ana maintains direct eye contact, ending in neutral position ready for seamless transition. Professional sports broadcast standard, perfect consistency with reference image.
`;
```

---

## 🎮 **API CLIENT WRAPPER**

### **VEO3 Client Class**
```javascript
class VEO3Client {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.kie.ai/api/v1/veo';
  }

  async generateVideo(prompt, options = {}) {
    const params = {
      prompt,
      imageUrls: [ANA_IMAGE_URL],
      model: "veo3_fast",
      aspectRatio: "9:16",
      seed: 30001,
      waterMark: "Fantasy La Liga Pro",
      enableTranslation: true,
      enableFallback: true,
      ...options
    };

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    return await response.json();
  }

  async getStatus(taskId) {
    const response = await fetch(`${this.baseUrl}/record-info?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }

  async waitForCompletion(taskId, timeout = 300000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getStatus(taskId);

      if (status.data?.successFlag === 1) {
        return status.data.response;
      } else if (status.data?.successFlag >= 2) {
        throw new Error(status.data.errorMessage || 'Video generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    throw new Error('Video generation timeout');
  }
}
```

---

## 🔧 **ERROR HANDLING**

### **Common Errors**

#### **Content Policy Violation**
```javascript
{
  "code": 400,
  "msg": "Your prompt was flagged by Website as violating content policies"
}

// Solution: Simplify prompt, remove commercial terms, use neutral language
```

#### **API Key Invalid**
```javascript
{
  "code": 401,
  "msg": "Unauthorized"
}

// Solution: Verify KIE_AI_API_KEY in environment
```

#### **Rate Limit Exceeded**
```javascript
{
  "code": 429,
  "msg": "Too many requests"
}

// Solution: Wait before retry, max 10 requests/minute
```

#### **Video Generation Failed**
```javascript
{
  "data": {
    "successFlag": 2,
    "errorMessage": "Generation failed due to technical error"
  }
}

// Solution: Retry with different seed or simplified prompt
```

### **Error Handling Pattern**
```javascript
async function handleVEO3Generation(prompt, options) {
  try {
    const result = await veo3Client.generateVideo(prompt, options);

    if (result.code !== 200) {
      throw new Error(`API Error: ${result.msg}`);
    }

    const video = await veo3Client.waitForCompletion(result.data.taskId);
    return video;

  } catch (error) {
    if (error.message.includes('content policies')) {
      // Retry with simplified prompt
      return await handleVEO3Generation(simplifyPrompt(prompt), options);
    } else if (error.message.includes('rate limit')) {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await handleVEO3Generation(prompt, options);
    } else {
      throw error;
    }
  }
}
```

---

## 💰 **COST TRACKING**

### **Cost Calculation**
```javascript
const COST_PER_VIDEO = 0.30; // USD per 8-second video

function calculateCost(videos) {
  return {
    totalVideos: videos.length,
    totalCost: videos.length * COST_PER_VIDEO,
    averageCostPerSecond: COST_PER_VIDEO / 8,
    estimatedMonthlyCost: videos.length * COST_PER_VIDEO * 30
  };
}
```

### **Usage Analytics**
```javascript
class VEO3Analytics {
  constructor() {
    this.usage = [];
  }

  trackGeneration(taskId, prompt, cost, duration) {
    this.usage.push({
      timestamp: new Date(),
      taskId,
      promptLength: prompt.length,
      cost,
      duration,
      success: true
    });
  }

  trackFailure(prompt, error) {
    this.usage.push({
      timestamp: new Date(),
      promptLength: prompt.length,
      error: error.message,
      success: false
    });
  }

  getMetrics() {
    const successful = this.usage.filter(u => u.success);
    const failed = this.usage.filter(u => !u.success);

    return {
      totalGenerations: this.usage.length,
      successRate: (successful.length / this.usage.length) * 100,
      totalCost: successful.reduce((sum, u) => sum + u.cost, 0),
      averageDuration: successful.reduce((sum, u) => sum + u.duration, 0) / successful.length,
      failureReasons: failed.map(f => f.error)
    };
  }
}
```

---

## 🎯 **BEST PRACTICES**

### **Prompt Optimization**
1. **Keep prompts under 500 characters** for best performance
2. **Always include Ana Character Bible exactly**
3. **Use Spanish only in dialogue sections**
4. **Avoid commercial terms** in descriptions
5. **Include transition setup** for concatenation

### **Performance Optimization**
1. **Use veo3_fast model** for production
2. **Reuse successful seeds** for consistency
3. **Batch requests** with 1-minute intervals
4. **Monitor API limits** (10 req/min)
5. **Cache successful prompts** for reuse

### **Quality Assurance**
1. **Manual review first video** from each new prompt
2. **Verify Ana consistency** across segments
3. **Check audio quality** for Spanish pronunciation
4. **Validate concatenation transitions** are smooth
5. **Monitor cost metrics** regularly

---

## 📊 **RESPONSE SCHEMAS**

### **Generate Video Response**
```typescript
interface GenerateVideoResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'pending';
  } | null;
}
```

### **Status Check Response**
```typescript
interface StatusResponse {
  code: number;
  data: {
    successFlag: 0 | 1 | 2;
    taskId: string;
    response: {
      resultUrls: string[];
      duration: number;
      cost: number;
    } | null;
    errorMessage?: string;
  };
}
```

### **Video Result**
```typescript
interface VideoResult {
  taskId: string;
  url: string;
  duration: number;
  cost: number;
  generatedAt: Date;
  prompt: string;
  success: boolean;
}
```

**Referencia técnica completa para integración Fantasy VEO3 Lab.** 🚀