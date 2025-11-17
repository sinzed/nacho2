# Debugging Guide: Jest vs Playwright

## 🎯 **My Recommendation: Jest for Development, Playwright for Validation**

### **For Your Question: "Creator visible to first player"**

**Use Jest** - It's faster and shows you exactly what's happening:

```bash
npm test -- -t "should show creator to first player"
```

You'll see:
- ✅ Server-side console.logs immediately
- ✅ Exact player state at each step
- ✅ Session IDs for debugging
- ✅ Runs in ~2 seconds

**Example output:**
```
[DEBUG] Creator's view after joining:
  Players: [ 'CreatorPlayer (abc123)' ]

[DEBUG] First player's view after joining:
  Players: [ 'CreatorPlayer (abc123)', 'FirstPlayer (xyz789)' ]
  Room state players: [ 'CreatorPlayer (abc123)', 'FirstPlayer (xyz789)' ]

[DEBUG] Test passed - Creator is visible to first player!
```

---

## 📊 **Side-by-Side Comparison**

| Feature | Jest (Unit/Integration) | Playwright (E2E) |
|---------|------------------------|-------------------|
| **Speed** | ⚡ ~2 seconds | 🐌 ~10-30 seconds |
| **Console Logs** | ✅ Immediate, all visible | ⚠️ Need to enable listeners |
| **Server Logs** | ✅ Direct access | ❌ Only via network |
| **State Inspection** | ✅ Direct: `client.state.players` | ⚠️ Via DOM: `page.locator()` |
| **Debugging** | ✅ IDE breakpoints work | ⚠️ Need browser DevTools |
| **Real User Experience** | ❌ No | ✅ Yes |
| **Browser Errors** | ❌ Can't see | ✅ Can capture |
| **Visual Debugging** | ❌ No screenshots | ✅ Screenshots/videos |
| **Network Debugging** | ❌ No | ✅ WebSocket messages |

---

## 🔧 **Enhanced Debugging Features**

### **Jest (Already Enhanced)**

1. **Debug Logs Added** - See player state at each step
2. **Verbose Output** - All console.logs shown
3. **Debug Mode** - `npm run test:debug` (Chrome DevTools)

**To see detailed logs:**
```bash
npm test -- -t "should show creator"
```

### **Playwright (Already Enhanced)**

1. **Console Logging** - Captures browser console
2. **Error Logging** - Captures page errors
3. **Screenshots** - Auto-captured on failure
4. **Videos** - Recorded on failure
5. **UI Mode** - `npm run test:e2e:ui` (interactive)

**To see browser console:**
```bash
npm run test:e2e:headed
```

---

## 🚀 **Quick Start Commands**

### **Jest (Recommended for Development)**
```bash
# Run specific test with logs
npm test -- -t "should show creator"

# Watch mode (auto-rerun on changes)
npm run test:watch

# Debug with Chrome DevTools
npm run test:debug
```

### **Playwright (For Final Validation)**
```bash
# Run all e2e tests
npm run test:e2e

# Interactive UI mode (BEST for debugging)
npm run test:e2e:ui

# See browser while testing
npm run test:e2e:headed

# Step-by-step debug
npm run test:e2e:debug
```

---

## 💡 **When to Use Which**

### **Use Jest When:**
- ✅ Developing new features
- ✅ Debugging server logic
- ✅ Testing state synchronization
- ✅ Quick iteration needed
- ✅ You want to see exact state values

### **Use Playwright When:**
- ✅ Testing full user flow
- ✅ Verifying UI updates correctly
- ✅ Testing across browsers
- ✅ Catching integration bugs
- ✅ Before releasing to production

---

## 🐛 **Debugging Tips**

### **Jest Debugging:**
1. Add `console.log()` in your test - it shows immediately
2. Inspect state: `console.log(client.state.players)`
3. Use `--testNamePattern` to run one test
4. Use `test.only()` to isolate a test

### **Playwright Debugging:**
1. Use `npm run test:e2e:ui` - best debugging experience
2. Check `test-results/` folder for screenshots
3. Enable console logging (already done in tests)
4. Use `page.pause()` to stop and inspect

---

## 📝 **Example: Debugging "Creator Not Visible" Issue**

### **With Jest (Fast):**
```bash
npm test -- -t "should show creator"
```
You'll immediately see:
- Server logs from `onJoin()`
- Exact player list in state
- Session IDs
- Any errors

### **With Playwright (Thorough):**
```bash
npm run test:e2e:ui
```
You'll see:
- Browser console errors
- Network requests
- DOM state
- Visual state (screenshots)

---

## 🎯 **Bottom Line**

**For development and debugging:** Use **Jest** - it's faster and shows you exactly what's happening in the server state.

**For validation and catching UI bugs:** Use **Playwright** - it tests the real user experience.

**Best practice:** Write Jest tests first, then add Playwright tests for critical user flows.

