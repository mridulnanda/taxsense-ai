# AI Tax Planning Engine - Quick Start Guide

Get the AI tax advisor running in 5 minutes.

## 1. Install Dependencies (1 minute)

```bash
npm install openai groq-sdk @anthropic-ai/sdk langchain pino
```

## 2. Get API Keys (2 minutes)

Choose at least one provider:

### Option A: OpenAI (Recommended)
1. Go to https://platform.openai.com/api/keys
2. Create new secret key
3. Copy to clipboard

### Option B: Groq (Fastest & Cheapest)
1. Go to https://console.groq.com
2. Create account
3. Get API key

### Option C: Anthropic (Best Alternative)
1. Go to https://console.anthropic.com
2. Create account
3. Get API key

## 3. Configure Environment (1 minute)

Create `.env.local`:

```bash
# Copy template
cp src/lib/ai/.env.example .env.local

# Edit with your keys
nano .env.local
```

Paste your API keys:
```
OPENAI_API_KEY=sk_...
# OR
GROQ_API_KEY=gsk_...
# OR
ANTHROPIC_API_KEY=sk-ant_...
```

## 4. Test It Works (1 minute)

```bash
npm run test tests/ai.test.ts
```

Should see:
```
✓ Provider Manager Tests
✓ Tax Advisor Tests
✓ NLP Tests
✓ Compliance Tests
```

## 5. Use It (Anywhere in your app)

### Simple Example
```typescript
import { taxAdvisor } from "@/lib/ai";
import { emptyProfile } from "@/lib/tax-engine";

const profile = {
  ...emptyProfile(),
  salary: { grossSalary: 1200000 }
};

const analysis = await taxAdvisor.analyzeProfile(profile);
console.log(analysis.recommendations);
```

### Chat API
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much tax will I pay?",
    "profile": {...}
  }'
```

### React Component
```typescript
export default function ChatComponent() {
  const [response, setResponse] = useState("");

  const handleChat = async (message: string) => {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode: "chat" })
    });
    const data = await res.json();
    setResponse(data.reply);
  };

  return (
    <div>
      <button onClick={() => handleChat("How to reduce tax?")}>
        Ask AI
      </button>
      <p>{response}</p>
    </div>
  );
}
```

## Features Available Now

✅ **Tax Analysis** - Analyze any tax profile  
✅ **Recommendations** - Get 5-8 personalized strategies  
✅ **Explanations** - Plain English descriptions  
✅ **Compliance** - Check audit risk & compliance  
✅ **Chat API** - Conversational interface  
✅ **Document Analysis** - Extract info from text  
✅ **Multi-language** - English & Hindi support  
✅ **Fallback** - Automatic provider switching  

## Next Steps

1. **Add More Features**
   - Integrate document uploads (file handling)
   - Add vision AI for receipt scanning
   - Build recommendation UI components

2. **Customize**
   - Adjust recommendation scoring
   - Add company-specific tax rules
   - Create custom compliance checks

3. **Deploy**
   - Set environment variables on production
   - Enable monitoring & logging
   - Set up error alerts

4. **Monitor**
   - Track API usage & costs
   - Monitor response times
   - Log all recommendations

## Common Commands

```bash
# Run tests
npm run test tests/ai.test.ts

# Run dev server
npm run dev

# Check types
npm run typecheck

# Watch mode
npm run test:watch
```

## Cost Estimate

**Monthly for 1,000 users:**
- OpenAI GPT-4: ~₹50,000
- Groq: ~₹5,000 (recommended)
- Anthropic: ~₹15,000

**Per recommendation:**
- OpenAI: ₹0.05-0.10
- Groq: ₹0.005-0.01 (10x cheaper!)
- Anthropic: ₹0.015-0.03

## Troubleshooting

### "No API key found"
**Solution**: Check `.env.local` has correct format
```
OPENAI_API_KEY=sk_...  # Must start with sk_
```

### "Provider failed"
**Solution**: Check internet connection & API key validity
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Slow responses
**Solution**: Use Groq instead (50ms vs 3s)
```
GROQ_API_KEY=gsk_...
AI_PRIMARY_PROVIDER=groq
```

### High costs
**Solution 1**: Switch to Groq (free tier available)  
**Solution 2**: Enable caching (1-hour TTL)  
**Solution 3**: Reduce API calls with batching  

## Documentation

📚 **Full Documentation**: `src/lib/ai/README.md`  
📋 **Implementation Guide**: `AI_IMPLEMENTATION_GUIDE.md`  
⚙️ **Configuration**: `src/lib/ai/.env.example`  
🧪 **Tests**: `tests/ai.test.ts`  

## API Reference

### POST /api/ai/chat

```json
{
  "message": "string",
  "mode": "chat|recommend|compliance|document-analysis",
  "profile": {...},
  "history": [],
  "uploadedDocuments": []
}
```

Response:
```json
{
  "reply": "string",
  "provider": "openai|groq|anthropic",
  "model": "string",
  "recommendations": [...],
  "complianceCheck": {...}
}
```

## Support

- 📧 Email: support@taxsenseai.com
- 💬 Discord: Join our community
- 🐛 GitHub Issues: Report bugs

---

**Ready to go!** You now have a production-grade AI tax advisor.

🚀 Start building!
