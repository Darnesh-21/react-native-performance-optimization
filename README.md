# React Native Performance Optimization: Large Flat Lists & Bridge Architecture

## Overview
This submission covers two critical performance topics in React Native:
1. Preventing unnecessary re-renders in large flat lists
2. Understanding the React Native Bridge and its performance implications

---

## 1. Preventing Unnecessary Re-Renders in Large Flat Lists

### Problem
When rendering large lists with FlatList in React Native, unnecessary re-renders can cause:
- Dropped frames
- Sluggish scrolling
- High memory consumption
- Poor user experience

### Solutions

#### A. Use `React.memo()` for List Items
Memoize each list item component to prevent re-renders when props haven't changed.

```javascript
const ListItem = React.memo(({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item.id)}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );
});
```

#### B. Use `useCallback()` for Event Handlers
Prevent new function references on every render.

```javascript
const handleItemPress = useCallback((itemId) => {
  navigation.navigate('Detail', { id: itemId });
}, [navigation]);
```

#### C. Proper FlatList Props
- `removeClippedSubviews={true}` - Unmount views outside viewport
- `maxToRenderPerBatch={10}` - Batch rendering for smoother scrolling
- `updateCellsBatchingPeriod={50}` - Delay between batches (ms)
- `initialNumToRender={10}` - Initial items to render
- `keyExtractor` - Always provide efficient key

#### D. Virtualization
FlatList automatically virtualizes, but optimize with:
```javascript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={20}
/>
```

#### E. Separate Data Structure Logic
Use Redux or Context API to manage list data separately from UI state.

---

## 2. React Native Bridge Explanation

### What is the Bridge?

The **React Native Bridge** is the communication layer between JavaScript and Native code (Java/Kotlin for Android, Objective-C/Swift for iOS).

### Architecture Overview

```
┌─────────────────────────────────────────┐
│         JavaScript Layer                 │
│    (React Components & Logic)            │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │   BRIDGE    │
      │  (Async)    │
      └──────┬──────┘
             │
┌────────────┴────────────────────────────┐
│      Native Layer                        │
│  (iOS/Android Modules)                  │
└─────────────────────────────────────────┘
```

### How It Works

1. **JS Thread** sends a message to the Native Bridge
2. **Bridge** queues the message asynchronously
3. **Native Thread** processes the message
4. **Native Module** executes native code
5. **Response** is sent back to JS via the Bridge

### Why It Matters for Performance

#### 1. **Asynchronous Communication**
- Bridge calls are async by default
- Prevents blocking either thread
- Enables smooth 60fps UI

#### 2. **Serialization Overhead**
- Data must be converted between JS and Native formats
- Frequent Bridge calls = performance penalty
- Pro tip: Batch operations to reduce cross-thread communication

#### 3. **Single Bridge Thread**
- All Bridge traffic funnels through one queue
- Heavy Bridge usage can become bottleneck
- Must be strategic about native module calls

#### 4. **Memory Considerations**
- Data is copied when sent across Bridge
- Large data transfers = memory spikes
- Process only necessary data

### Performance Best Practices for Bridge

✅ **DO:**
- Batch native module calls
- Pass minimal required data
- Use native implementations for heavy computation
- Cache results when possible

❌ **DON'T:**
- Make frequent small Bridge calls in loops
- Send large objects repeatedly
- Block the main JS thread waiting for native response
- Ignore Bridge bottlenecks in profiling

---

## Key Performance Metrics

| Scenario | Impact | Solution |
|----------|--------|----------|
| Large list without memoization | High re-renders | Use `React.memo()` + `useCallback()` |
| Frequent Bridge calls | Thread congestion | Batch operations |
| Large data transfers | Memory spike | Send only needed data |
| Missing list keys | View recycling issues | Use unique `keyExtractor` |

---

## References

- React Native Optimization: https://reactnative.dev/docs/optimizing-flatlist-configuration
- Bridge Architecture: https://reactnative.dev/docs/native-modules-intro
- React.memo: https://react.dev/reference/react/memo
- useCallback: https://react.dev/reference/react/useCallback

---

**Submission Date:** February 23, 2026
**Status:** Complete
