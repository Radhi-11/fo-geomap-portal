# Plan: Ensure 100% State Isolation Between File Uploads

## Goal
Make every file upload in `NewProjectModal` completely independent — no state, cache, or leftover data from previous uploads persists when a user uploads a new file.

## Root Cause Analysis

### Current Architecture
- `NewProjectModal` is rendered inside `ProjectListPage` and `UserDashboardPage` (lines 268-272 / line 86)
- Parent controls modal visibility via `isModalOpen` state → passed as `isOpen` prop
- **Critical issue**: When `isOpen` is `false`, component returns `null` (line 18) but **stays mounted**. React state persists.

### Identified State Leakage Points

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 1 | `NewProjectModal.tsx:18` | `if (!isOpen) return null;` keeps component mounted with old state | `kmzFile`, `boqFile`, `loading`, `loadingText` persist when modal reopens |
| 2 | `NewProjectModal.tsx:337,348` | `<input type="file">` elements never reset | Selecting same file again → `onChange` doesn't fire → old file used |
| 3 | `NewProjectModal.tsx:260-318` | `handleSubmit` has no guard against closing during async parse | Pending `FileReader`/fetch operations can update unmounted/invisible component |
| 4 | `NewProjectModal.tsx:84-208` | `parseBoqExcel` and `parseKmlCoordinates` are pure but caller doesn't guard against stale refs | Not the parser's fault, but no cleanup of in-flight reads |

### What's ALREADY correct (do not change)
- `parseBoqExcel`: all variables are local (`let projectName`, `let lengthKm`, etc.) — fresh per call ✓
- `parseKmlCoordinates`: creates `new JSZip()` and `new FileReader()` each call — fresh per call ✓
- `handleSubmit`: local variables (`totalCalculatedValue`, `detectedCity`, etc.) are fresh per call ✓
- KMZ/KML parsing logic, Excel parsing logic, geocoding fetch, UI layout — all working ✓

## Changes

### Scope: `src/components/NewProjectModal.tsx` ONLY

#### Step 1: Add state reset on `isOpen` change
- Add `useEffect` that watches `isOpen`
- When `isOpen` changes to `true`, reset `kmzFile`, `boqFile`, `loading`, `loadingText` to initial values
- Reset file input element values via refs

#### Step 2: Reset file inputs on re-open
- Add `useRef<HTMLInputElement>` for both file inputs
- In the `isOpen` effect (above), reset `inputRef.current.value = ''` to allow selecting the same file again
- Also reset when new files are selected to clear stale references

#### Step 3: Guard async operations against stale state
- Add `isMounted` or `AbortController` pattern:
  - `const isMountedRef = useRef(true);`
  - Set `isMountedRef.current = false` in a cleanup `useEffect` return
  - Guard `setLoading`, `setLoadingText`, `onSuccess`, `onClose` calls with `if (isMountedRef.current)`
- Specifically in `handleSubmit`: check `isMountedRef.current` before calling `onSuccess`/`onClose`

#### Step 4: Clean up file input refs on unmount
- Reset input `.value` to `''` in cleanup effect to prevent stale file references held by DOM

### What is NOT changed
- No changes to parent components (`ProjectListPage.tsx`, `UserDashboardPage.tsx`)
- No changes to KMZ/KML parsing logic
- No changes to Excel BoQ parsing logic (already dynamic and stateless)
- No changes to geocoding fetch logic
- No changes to UI layout, styles, or component structure

## Validation Checklist

- [ ] Close modal → reopen → file input values are empty (can select same file again)
- [ ] Upload file 1 → close modal → reopen → upload file 2 → file 2 data is used, not file 1
- [ ] Upload same file twice in a row → `onChange` fires both times
- [ ] Close modal during async parsing (geocoding/fetch) → no crash, no state update after unmount
- [ ] `npx oxlint` — no errors in NewProjectModal.tsx
- [ ] `npx tsc --noEmit` — no type errors in NewProjectModal.tsx
- [ ] `npx vite build` — successful production build