## AI Telephone Game - User Flow & Data Analysis

### 🔄 USER FLOW (Step-by-Step)

```
1. USER INPUT PHASE
   ├─ User enters phrase in textarea
   ├─ Clicks "Start Competition" button
   └─ setIsLoading(true), setGameResult(null)

2. BACKEND API CALL (Single Request)
   ├─ Frontend calls: runTelephoneGameWithModels(phrase)
   ├─ Backend receives phrase once
   └─ Initiates parallel processing

3. PARALLEL MODEL PROCESSING (3 models run simultaneously)
   ├─ Model 1: Groq Llama 3.3 70B
   │  ├─ API Call 1: Translate to French
   │  ├─ API Call 2: Translate French → Spanish
   │  ├─ API Call 3: Translate Spanish → English
   │  └─ Calculate similarity (local, no API)
   │
   ├─ Model 2: Google Gemini 2.5 Flash Lite
   │  ├─ API Call 1: Translate to French
   │  ├─ API Call 2: Translate French → Spanish
   │  ├─ API Call 3: Translate Spanish → English
   │  └─ Calculate similarity (local, no API)
   │
   └─ Model 3: XAI Grok Code Fast 1
      ├─ API Call 1: Translate to French
      ├─ API Call 2: Translate French → Spanish
      ├─ API Call 3: Translate Spanish → English
      └─ Calculate similarity (local, no API)

4. RESULTS COLLECTION & SORTING
   ├─ Collect all 3 model results
   ├─ Sort by similarity score (highest first)
   ├─ Identify winner (highest similarity)
   └─ Return single GameResult object

5. FRONTEND DISPLAY
   ├─ setGameResult(result)
   ├─ setIsLoading(false)
   └─ Render all results in table format
```

### 📊 API CALL BREAKDOWN

**Total AI API Calls per Game:**
- Model 1 (Groq): 3 calls (French, Spanish, English translations)
- Model 2 (Google): 3 calls (French, Spanish, English translations)
- Model 3 (XAI): 3 calls (French, Spanish, English translations)
- **TOTAL: 9 AI calls per game**

**NO DUPLICATE CALLS:** ✅
- Each model processes once
- No retries or redundant calls
- Running in parallel (not sequential)

**NO ENDLESS LOOPS:** ✅
- Fixed chain: Original → French → Spanish → English (3 steps)
- Clear termination point
- Error handling stops execution

### 💰 COST CALCULATION

**Per Game Cost:**
- Avg tokens per translation: ~100-150 tokens input, ~100-150 tokens output
- Model 1 (Groq): ~1,500 tokens → $0.075 (@ $0.05/M)
- Model 2 (Google): ~1,500 tokens → $0.15 (@ $0.10/M)
- Model 3 (XAI): ~1,500 tokens → $0.30 (@ $0.20/M)
- **Per game: ~$0.525**

**With $5 credits:**
- $5 ÷ $0.525 = **~9-10 full games**
- Or **~95-100 games** if estimates are generous

### 🔍 DATA FLOW VERIFICATION

**Frontend → Backend:**
```
user input phrase
    ↓
handleStart() called
    ↓
runTelephoneGameWithModels(phrase) [Server Action]
    ↓
Backend receives phrase (ONE TIME)
```

**Backend Processing:**
```
phrase → Promise.all([model1, model2, model3])
    ↓
Each model runs independently in parallel:
    phrase → Groq API → French result → Groq API → Spanish result → Groq API → English result
    phrase → Google API → French result → Google API → Spanish result → Google API → English result
    phrase → XAI API → French result → XAI API → Spanish result → XAI API → English result
    ↓
Wait for all 3 to complete (Promise.all)
    ↓
Sort results by similarity
    ↓
Return GameResult
```

**Backend → Frontend:**
```
GameResult object returned (ONCE)
    ↓
Frontend receives complete results
    ↓
Render all 3 models' results in tables
    ↓
Display winner
```

### ✅ FLOW VERIFICATION CHECKLIST

- [x] **Single Frontend API Call:** ✅ One call to runTelephoneGameWithModels()
- [x] **No Duplicate Calls:** ✅ Each model-translation combo runs exactly once
- [x] **No Endless Loops:** ✅ Fixed 3-step chain (French → Spanish → English)
- [x] **Parallel Processing:** ✅ All 3 models run simultaneously with Promise.all()
- [x] **Clear Data Flow:** ✅ Phrase flows in, GameResult flows out
- [x] **Error Handling:** ✅ Try-catch prevents infinite retries
- [x] **Similarity Calculation:** ✅ Local computation (no API calls)
- [x] **Sorting:** ✅ Results sorted client-side after all complete
- [x] **Display Ready:** ✅ All data returned at once for frontend rendering

### 🎯 CONCLUSION

**The flow is CORRECT:**
- ✅ Exactly 9 API calls per game (3 models × 3 translations)
- ✅ No duplicate calls
- ✅ No infinite loops
- ✅ Efficient parallel execution
- ✅ Clean data flow: input → processing → output → display
- ✅ Cost-efficient for $5 budget
