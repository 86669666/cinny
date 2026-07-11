# Cinny-Hermes Memory Leak Audit: Room Switching & Matrix Lifecycle

**Audit date:** 2026-07-11
**Codebase:** /Users/won/workspace/cinny-hermes/cinny/src/

---

## EXECUTIVE SUMMARY

**1 HIGH**, **2 MEDIUM**, **4 LOW** severity findings. Room-switching is well-handled via React key-based unmount. The single critical bug is in `CallEmbed.ts` where `.bind()` defeats Matrix client listener removal.

---

## HIGH SEVERITY

### 1. CallEmbed.ts — Matrix client listener leak via .bind(this)

**File:** `src/app/plugins/call/CallEmbed.ts`
**Lines:** 248–270 (registration at 248–251, failed cleanup at 267–270)
**Severity:** HIGH

**Description:**
The CallEmbed class registers 4 Matrix client event listeners using `.bind(this)`:

```typescript
// Line 248-251 — Registration:
this.mx.on(ClientEvent.Event, this.onEvent.bind(this));
this.mx.on(MatrixEventEvent.Decrypted, this.onEventDecrypted.bind(this));
this.mx.on(RoomStateEvent.Events, this.onStateUpdate.bind(this));
this.mx.on(ClientEvent.ToDeviceEvent, this.onToDeviceEvent.bind(this));

// Line 267-270 — Failed cleanup:
this.mx.off(ClientEvent.Event, this.onEvent.bind(this));
this.mx.off(MatrixEventEvent.Decrypted, this.onEventDecrypted.bind(this));
this.mx.off(RoomStateEvent.Events, this.onStateUpdate.bind(this));
this.mx.off(ClientEvent.ToDeviceEvent, this.onToDeviceEvent.bind(this));
```

Every `.bind(this)` call creates a **new function identity**. The `mx.off()` calls pass different references than the `mx.on()` calls, so they never match and **all 4 listeners leak** for every CallEmbed instance.

**Impact:** Each call creates a CallEmbed → dispose removes the iframe/container but leaks 4 listeners on the global MatrixClient. In rooms that frequently start/stop calls, listeners accumulate until app restart. These handlers call `feedEvent()` and `feedStateUpdate()` which touch the already-disposed `this.call`, potentially causing errors in addition to the memory leak.

**Fix:** Store bound references at registration time:
```typescript
// Register:
this.boundOnEvent = this.onEvent.bind(this);
this.boundOnEventDecrypted = this.onEventDecrypted.bind(this);
this.boundOnStateUpdate = this.onStateUpdate.bind(this);
this.boundOnToDeviceEvent = this.onToDeviceEvent.bind(this);
this.mx.on(ClientEvent.Event, this.boundOnEvent);
this.mx.on(MatrixEventEvent.Decrypted, this.boundOnEventDecrypted);
this.mx.on(RoomStateEvent.Events, this.boundOnStateUpdate);
this.mx.on(ClientEvent.ToDeviceEvent, this.boundOnToDeviceEvent);

// Dispose:
this.mx.off(ClientEvent.Event, this.boundOnEvent);
this.mx.off(MatrixEventEvent.Decrypted, this.boundOnEventDecrypted);
this.mx.off(RoomStateEvent.Events, this.boundOnStateUpdate);
this.mx.off(ClientEvent.ToDeviceEvent, this.boundOnToDeviceEvent);
```

---

## MEDIUM SEVERITY

### 2. useDebounce.ts — setTimeout not cleared on unmount

**File:** `src/app/hooks/useDebounce.ts`
**Lines:** 18–34
**Severity:** MEDIUM

**Description:**
The `useDebounce` hook creates timeouts via `window.setTimeout()` inside a `useCallback` but never clears them when the component unmounts. If a component unmounts while a debounced callback is pending, the timeout fires with a stale callback reference and calls `setState` on an unmounted component.

```typescript
// Line 25-28: setTimeout without cleanup on unmount
timeoutIdRef.current = window.setTimeout(() => {
  callback(...cbArgs);
  timeoutIdRef.current = undefined;
}, wait);
```

**Fix:** Add a `useEffect` cleanup that calls `clearTimeout(timeoutIdRef.current)` on unmount.

### 3. useThrottle.ts — setTimeout not cleared on unmount

**File:** `src/app/hooks/useThrottle.ts`
**Lines:** 29–35
**Severity:** MEDIUM

**Description:**
Same pattern as `useDebounce`. The throttle timeout is not cleared on unmount:

```typescript
// Line 29-35: setTimeout without cleanup on unmount
timeoutIdRef.current = window.setTimeout(() => {
  if (argsRef.current) {
    callback(...argsRef.current);
  }
  argsRef.current = undefined;
  timeoutIdRef.current = undefined;
}, wait);
```

**Fix:** Add `useEffect` cleanup that calls `clearTimeout(timeoutIdRef.current)`.

---

## LOW SEVERITY

### 4. useTypingStatusUpdater.ts — setTimeout without cleanup

**File:** `src/app/hooks/useTypingStatusUpdater.ts`
**Lines:** 24–29
**Severity:** LOW

**Description:**
`setTimeout` for auto-clearing typing status has no `clearTimeout` on unmount. The timer fires `mx.sendTyping(roomId, false, ...)` after 5 seconds. The ref-based guard (`statusSentTsRef.current === sentTs`) prevents side effects if another typing update happens, but if the component (and MatrixClient) unmounts, this still fires a network call.

### 5. typingMembers.ts — setTimeout in Jotai atom setter

**File:** `src/app/state/typingMembers.ts`
**Lines:** 92–112
**Severity:** LOW

**Description:**
A `setTimeout` is created inside a Jotai atom write function to auto-remove typing receipts after 5 seconds. This is not cleanable by design (Jotai atom setters don't have a disposal lifecycle), but every `PUT` action spawns a new timeout. In high-frequency typing scenarios across many rooms, N timeouts accumulate. Each timeout reads atoms and potentially dispatches a `DELETE` action. The functional guards prevent wrong state updates, but the timer resources are not freed until they fire.

### 6. RoomTimeline.tsx — setTimeout in reply handler

**File:** `src/app/features/room/RoomTimeline.tsx`
**Line:** 978
**Severity:** LOW

**Description:**
```typescript
setTimeout(() => ReactEditor.focus(editor), 100);
```
This is inside a `useCallback` handler for reply clicks. If the component unmounts within 100ms, it calls `ReactEditor.focus()` on a potentially removed Slate editor. Very low risk due to the extremely short timeout.

### 7. RoomTimeline.tsx — setTimeout to clear focus item

**File:** `src/app/features/room/RoomTimeline.tsx`
**Lines:** 843–849
**Severity:** LOW (safe)

**Description:**
```typescript
setTimeout(() => {
  if (!alive()) return;   // ← guard prevents stale setState
  setFocusItem((currentItem) => {
    if (currentItem === focusItem) return undefined;
    return currentItem;
  });
}, 2000);
```
Uses `useAlive()` guard, so stale state updates are prevented. **Not a real leak**, documented for completeness.

---

## ROOM SWITCHING ANALYSIS

**RoomProvider pattern:** `key={room.roomId}` on `<RoomProvider>` in both `SpaceRouteRoomProvider.tsx` (lines 44, 70) and the Direct/Home `RoomProvider.tsx` files. This causes React to **unmount the entire room tree and re-mount** on room switch, which is the correct pattern for cleanup.

**All room-scoped hooks properly clean up:**
- `useRoomLatestRenderedEvent.ts`: `room.on(RoomEvent.Timeline, ...)` → `return() room.removeListener(...)` ✅
- `useRoomEventReaders.ts`: `room.on(RoomEvent.Receipt, ...)` + `room.on(RoomEvent.LocalEchoUpdated, ...)` → cleanup ✅
- `useRoomMeta.ts`: `room.on(RoomEvent.Name, ...)` → cleanup ✅
- `useRoomAccountData.ts`: `room.on(RoomEvent.AccountData, ...)` → cleanup ✅
- `useRoomMembers.ts`: `mx.on(RoomMemberEvent.Membership, ...)` + `mx.on(RoomMemberEvent.PowerLevel, ...)` → cleanup ✅
- `useRoomState.ts`: `roomState?.on(RoomStateEvent.Events, ...)` → cleanup ✅
- `useMembership.ts`: `member?.on(RoomMemberEvent.Membership, ...)` → cleanup ✅
- `RoomTimeline.tsx` `useLiveEventArrive`: `room.on(Timeline)` + `room.on(Redaction)` → cleanup ✅
- `RoomTimeline.tsx` `useLiveTimelineRefresh`: `room.on(TimelineRefresh)` → cleanup ✅

**All global MatrixClient hooks properly clean up:**
- `useSyncState.ts`: `mx.on(ClientEvent.Sync, ...)` → cleanup ✅
- `useStateEventCallback.ts`: `mx.on(RoomStateEvent.Events, ...)` → cleanup ✅
- `useAccountDataCallback.ts`: `mx.on(ClientEvent.AccountData, ...)` → cleanup ✅
- `useDeviceList.ts`: `mx.on(CryptoEvent.DevicesUpdated, ...)` → cleanup ✅
- `useKeyBackup.ts`: All 4 `mx.on(CryptoEvent.*)` → cleanup ✅
- `useUserTrustStatusChange.ts`: `mx.on(CryptoEvent.UserTrustStatusChanged, ...)` → cleanup ✅
- `useRecentEmoji.ts`: `mx.on(ClientEvent.AccountData, ...)` → cleanup ✅
- `useVerificationRequest.ts`: All verifier/request listeners → cleanup ✅
- `useCall.ts`: `mx.matrixRTC.on(...)` → cleanup ✅
- `useUserPresence.ts`: `user?.on(...)` → cleanup ✅
- `useUserProfile.ts`: `user?.on(...)` → cleanup ✅
- `EncryptedContent.tsx`: `mEvent.on(MatrixEventEvent.Decrypted, ...)` → cleanup ✅
- `useRelations.ts`: `relations.on(...)` → cleanup ✅

**All global state bindings properly clean up:**
- `roomToParents.ts` `useBindRoomToParentsAtom`: 4 `mx.on()` → 4 `mx.removeListener()` ✅
- `roomToUnread.ts` `useBindRoomToUnreadAtom`: 3 `mx.on()` → 3 `mx.removeListener()` ✅
- `utils.ts` `useBindRoomsWithMembershipsAtom`: 3 `mx.on()` → 3 `mx.removeListener()` ✅
- `mDirectList.ts` `useBindMDirectAtom`: `mx.on(ClientEvent.AccountData, ...)` → cleanup ✅
- `typingMembers.ts` `useBindRoomIdToTypingMembersAtom`: `mx.on(RoomMemberEvent.Typing, ...)` → cleanup ✅
- `ClientNonUIFeatures.tsx` `MessageNotifications`: `mx.on(Timeline, ...)` → cleanup ✅
- `ClientRoot.tsx` `useLogoutListener`: `mx.on(SessionLoggedOut, ...)` → cleanup ✅

**All DOM event listeners properly clean up:**
- `useKeyDown.ts`: `addEventListener('keydown')` → `removeEventListener` ✅
- `useDocumentFocusChange.ts`: `addEventListener('focusin'/'focusout')` → `removeEventListener` ✅
- `useTheme.ts`: `darkModeQueryList.addEventListener('change')` → `removeEventListener` ✅
- `useComposingCheck.ts`: `addEventListener('compositionstart'/'compositionend')` → `removeEventListener` ✅
- `usePermission.ts`: `permStatus.addEventListener('change')` → `removeEventListener` ✅
- `SSOStage.tsx`: `window.addEventListener('message')` → `removeEventListener` ✅
- `useFileDrop.ts`: All drag listeners → `removeEventListener` ✅
- `RoomView.tsx`: `document.addEventListener('hermes-auto-action')` → `removeEventListener` ✅
- `usePan.ts`: `document.addEventListener('mousemove'/'mouseup')` → `removeEventListener` ✅
- All media hooks: `addEventListener(...)` → `removeEventListener(...)` ✅

**Timers/Intervals:**
- `useInterval.ts`: `clearInterval` in useEffect cleanup ✅
- `useTimeoutToggle.ts`: `clearTimeout` in useEffect cleanup ✅
- `AsyncSearch.ts`: Internal `clearTimeout` + `terminateSearch()` ✅

**Observers:**
- `useIntersectionObserver.ts`: `disconnect()` + `unobserve()` cleanup ✅
- `useResizeObserver.ts`: `disconnect()` + `unobserve()` cleanup ✅

---

## WEBSOCKET CONNECTIONS

The Matrix JS SDK manages a single persistent WebSocket per `MatrixClient` instance. The app creates one `MatrixClient` at startup (`initClient` in `initMatrix.ts`), stores it in React context, and starts it once (`startClient` → `mx.startClient()`). On logout/cache-clear, `mx.stopClient()` tears down the WebSocket. No WebSocket accumulation issue found.

`mx.setMaxListeners(50)` is set in `initClient.ts` (line 38), which provides headroom for the ~40 event listeners registered across the app, but this is a symptom-suppression measure rather than a fix — the CallEmbed leak above will eventually exhaust even this elevated limit if calls are frequently made.

---

## RECOMMENDATIONS (in priority order)

1. **Fix CallEmbed.ts .bind leak** (HIGH) — Store bound function references, use them in both `.on()` and `.off()`.
2. **Add cleanup to useDebounce/useThrottle** (MEDIUM) — Add `useEffect(() => () => clearTimeout(ref.current), [])`.
3. **Add cleanup to useTypingStatusUpdater** (LOW) — Store timer ID in a ref, clear in useEffect cleanup.
