# AI Tax Planning Engine

Advanced AI-powered tax planning system with GPT-4 integration, multi-provider support, and enterprise-grade safety features.

## Features

### 1. Multi-Provider LLM Integration
- **OpenAI GPT-4** (Primary) - Most capable, best for complex analysis
- **Groq** (Fast) - Ultra-low latency for real-time interactions
- **Anthropic Claude** (Fallback) - High accuracy alternative
- Automatic fallback when primary provider fails
- Unified provider interface for easy switching

### 2. Intelligent Tax Analysis
- **Profile Analysis** - Deep analysis of tax situation
- **Personalized Recommendations** - 5-8 tailored strategies per profile
- **Savings Estimation** - Conservative estimates with confidence scores
- **Priority Ranking** - Recommendations sorted by impact and compliance
- **Edge Case Detection** - Identifies problematic scenarios

### 3. Natural Language Processing
- **Information Extraction** - Parse tax data from text
- **Document Analysis** - Extract info from financial documents
- **Question Classification** - Auto-categorize tax queries
- **Multi-language Support** - English and Hindi
- **Audit-friendly Explanations** - Generate compliance documentation

### 4. Compliance & Audit Management
- **Compliance Validation** - Check recommendations against tax laws
- **Audit Risk Assessment** - Quantify audit risk score
- **Documentation Requirements** - List needed documents
- **Compliance Reports** - Generate audit-ready reports
- **Red Flag Detection** - Identify problematic patterns

### 5. Conversational Interface
- **Chat API** - Multi-turn conversations
- **Context Awareness** - Maintains conversation history
- **Document Upload** - Process tax documents
- **Real-time Streaming** - Stream responses as they generate
- **Recommendation Mode** - Quick tax strategy lookup

## Architecture

```
src/lib/ai/
├── provider.ts           # LLM provider abstraction layer
├── tax-advisor.ts        # Tax recommendation engine
├── nlp.ts               # Natural language processing
├── compliance.ts        # Compliance and audit risk assessment
├── types.ts             # TypeScript type definitions
├── index.ts             # Module exports
└── README.md            # This file
```

## Installation & Setup

### 1. Install Dependencies
```bash
npm install openai groq-sdk @anthropic-ai/sdk langchain pino
```

### 2. Configure API Keys
Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp src/lib/ai/.env.example .env.local
```

Edit `.env.local`:
```
OPENAI_API_KEY=sk_...
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant_...
```

### 3. Optional: Use Demo Mode
The system works without API keys in demo mode (mock responses).

## Usage

### Basic Tax Analysis

```typescript
import { taxAdvisor } from "@/lib/ai";
import { emptyProfile } from "@/lib/tax-engine";

const profile = {
  ...emptyProfile(),
  age: 35,
  salary: {
    grossSalary: 1200000,
    basicPlusDA: 600000,
    // ... other fields
  }
};

const analysis = await taxAdvisor.analyzeProfile(profile);
console.log("Recommendations:", analysis.recommendations);
console.log("Total Savings Potential:", analysis.totalPotentialSavings);
```

### Chat API Integration

```typescript
// POST /api/ai/chat
const response = await fetch("/api/ai/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "How can I reduce my tax liability?",
    mode: "chat",
    profile: userProfile,
    history: [],
  }),
});

const data = await response.json();
console.log(data.reply); // AI response
console.log(data.provider); // Which AI provider was used
```

### Document Analysis

```typescript
import { taxNLP } from "@/lib/ai";

const documentText = `PAYSLIP
Gross: ₹1,00,000
Deductions: ₹15,000
Net: ₹85,000`;

const analysis = await taxNLP.extractTaxInfo(documentText);
console.log("Extracted Info:", analysis.extractedInfo);
console.log("Document Type:", analysis.documentType);
```

### Compliance Checking

```typescript
import { complianceAI } from "@/lib/ai";

const compliance = await complianceAI.validateRecommendation(
  recommendation,
  userProfile
);

console.log("Compliant:", compliance.isCompliant);
console.log("Audit Risk:", compliance.auditRiskScore);
console.log("Issues:", compliance.issues);
```

## API Endpoints

### POST /api/ai/chat
Conversational tax advisor with context awareness.

**Request:**
```json
{
  "message": "How much can I invest in PPF?",
  "mode": "chat",
  "profile": {...},
  "history": [],
  "conversationId": "conv_..."
}
```

**Response:**
```json
{
  "reply": "Based on your income...",
  "provider": "openai",
  "model": "gpt-4-turbo",
  "conversationId": "conv_...",
  "mode": "chat"
}
```

### Modes

- **chat** - General conversation
- **recommend** - Get specific recommendations
- **compliance** - Check compliance issues
- **document-analysis** - Analyze uploaded documents

## Configuration Options

### Environment Variables

```
OPENAI_API_KEY=        # OpenAI API key
OPENAI_MODEL=          # Model (default: gpt-4-turbo)
GROQ_API_KEY=          # Groq API key
GROQ_MODEL=            # Model (default: mixtral-8x7b-32768)
ANTHROPIC_API_KEY=     # Anthropic API key
ANTHROPIC_MODEL=       # Model (default: claude-3-5-sonnet-20241022)
AI_LOG_LEVEL=          # Log level (debug/info/warn/error)
```

### Provider Selection

Automatic fallback order:
1. OpenAI GPT-4 (if OPENAI_API_KEY set)
2. Groq (if GROQ_API_KEY set)
3. Anthropic Claude (if ANTHROPIC_API_KEY set)

Override with environment variable:
```
AI_PRIMARY_PROVIDER=groq  # Use Groq as primary
```

## Safety Features

### 1. Confidence Scoring
Every recommendation includes a confidence score (0-1) indicating:
- Legal precedent strength
- Historical accuracy
- Audit risk factors
- Individual circumstance fit

### 2. Compliance Validation
- Checks against IT Act 1961
- Validates against CBDT circulars
- Flags ambiguous tax positions
- Requires documentation proof

### 3. Audit Risk Assessment
- Calculates overall audit risk (0-1)
- Identifies specific trigger points
- Suggests documentation priorities
- Recommends advisor review if needed

### 4. Documentation Requirements
Each recommendation includes:
- Required documents
- Retention period
- Acceptable formats
- Why it's needed

### 5. Fact Checking
All savings estimates are:
- Conservative (not optimistic)
- Range-based (min-max)
- Confidence-weighted
- Compared against benchmarks

## Testing

Run comprehensive test suite:

```bash
npm run test tests/ai.test.ts
```

Test coverage includes:
- Provider fallback mechanism (4 tests)
- Tax analysis & recommendations (8 tests)
- Natural language processing (8 tests)
- Compliance validation (6 tests)
- Integration workflows (3 tests)
- Error handling & edge cases (5+ tests)

### Test Data

Profiles are pre-configured for testing:
- Low income (₹5L)
- Middle income (₹12L)
- High income (₹50L)
- Complex profile (multiple income sources)

## Performance Optimization

### Caching
- Recommendations cached for 1 hour
- NLP classifications cached for 24 hours
- Compliance checks cached for 30 days

### Rate Limiting
- 60 requests per minute per user
- 90,000 tokens per minute quota
- Automatic backoff on rate limit

### Streaming
Real-time responses for better UX:
```typescript
await providerManager.getProvider().stream(
  messages,
  (chunk) => console.log(chunk),
  { temperature: 0.7 }
);
```

## Logging & Monitoring

### Structured Logging with Pino
```
{
  "level": 30,
  "time": "2024-09-28T10:30:00.000Z",
  "pid": 1234,
  "hostname": "server",
  "provider": "openai",
  "model": "gpt-4-turbo",
  "msg": "Tax analysis completed"
}
```

### Metrics to Track
- Provider usage distribution
- Average response times
- Error rates per provider
- Token consumption
- Cache hit rates
- User satisfaction scores

## Best Practices

### 1. Profile Quality
- Ensure all income sources are included
- Verify deduction amounts
- Update age and family status
- Include special circumstances

### 2. Message Context
- Provide full tax year information
- Include previous tax filings
- Mention specific concerns
- State risk tolerance

### 3. Document Uploads
- Start with payslips/Form 16
- Add investment statements
- Include expense receipts
- Upload rental agreements

### 4. Review Recommendations
- Check audit risk scores
- Verify documentation requirements
- Confirm applicability to situation
- Discuss with tax professional

## Troubleshooting

### No provider available
```
Error: No LLM provider available
Solution: Set OPENAI_API_KEY or GROQ_API_KEY
```

### Slow responses
```
Current: GPT-4 (slow but accurate)
Try: Switch to Groq for faster responses
Set: AI_PRIMARY_PROVIDER=groq
```

### Inconsistent recommendations
```
Issue: Different models may vary
Solution: Use same provider for consistency
Retry: With lower temperature (0.1-0.3)
```

## Future Enhancements

1. **Vision AI** - Receipt/invoice image processing
2. **Predictive Models** - Forecast tax liability
3. **Real-time Updates** - Government rule changes
4. **Integration APIs** - Connect to tax filing portals
5. **Multi-user Collaboration** - Family tax planning
6. **Blockchain Verification** - Tamper-proof recommendations
7. **Advanced Analytics** - Peer benchmarking

## Support & Contribution

For issues, feature requests, or contributions:
1. Check existing documentation
2. Search GitHub issues
3. Open detailed bug reports
4. Submit pull requests

## License

Proprietary - MNB Research (c) 2024
