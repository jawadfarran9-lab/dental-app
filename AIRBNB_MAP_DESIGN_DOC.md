# Airbnb-Grade Map: Design Document

**Status: DESIGN ONLY — No implementation until approved**
**Date: 2025-01-XX**
**Baseline commit: `f739d60` (tag `v1.0.0-map-stable`)**

---

## Table of Contents

- [A. Current State Audit](#a-current-state-audit)
- [B. Zoom-Tier Budget Strategy](#b-zoom-tier-budget-strategy)
- [C. Dense-Area Clustering Algorithm](#c-dense-area-clustering-algorithm)
- [D. Interaction Spec](#d-interaction-spec)
- [E. Validation & Performance Plan](#e-validation--performance-plan)
- [F. Surgical Diff Plan](#f-surgical-diff-plan)

---

## A. Current State Audit

### A.1 File Inventory

| File | Lines | Role |
|------|-------|------|
| `app/(tabs)/clinics/map.tsx` | 1045 | Full map screen: filtering, approval pipeline, markers, UI |
| `src/components/ClinicBottomCard.tsx` | ~570 | PanResponder bottom sheet (3 snap points) |
| `src/utils/geoDistance.ts` | — | `getDistanceBetween()` — Haversine, rounds to 0.1 km |

### A.2 Current Approval Pipeline (map.tsx)

```
filteredClinics (geo valid → category → radius)
        ↓
  Viewport filter (lat/lng bounds)
        ↓
  Distance sort (rawDistanceKm + id tiebreaker)
        ↓
  Collision resolution (boxesOverlap: 16%W × 8%H)
        ↓
  Density cap (maxLabelsForTier)
        ↓
  baseApprovedIds → stableBaseApprovedIds (reference guard)
        ↓
  Two render layers: densityMarkers[] + interactionMarker?
```

### A.3 Current Density Budget

| Zoom Tier (km) | `maxLabelsForTier` | Equivalent Zoom Level | Airbnb Equivalent |
|---|---|---|---|
| 200 | **2** | ~Z5 (continent) | ~15-20 markers |
| 100 | **2** | ~Z6 (large country) | ~12-15 markers |
| 50 | **4** | ~Z8 (state/region) | ~10-12 markers |
| 25 | **4** | ~Z9 (metro area) | ~8-10 markers |
| 10 | **6** | ~Z11 (city) | ~15-25 markers |
| 5 | **8** | ~Z13 (neighborhood) | ~20-40 markers |

**Problem:** Current budgets are 3-10× lower than Airbnb's density. At city zoom, users see only 6 markers despite 20+ clinics being in view. The rest silently vanish — no cluster indicator, no "+N" badge. Users have zero affordance that more clinics exist.

### A.4 Current Collision Model

```
LABEL_BOX_W = 0.16 (16% viewport width)
LABEL_BOX_H = 0.08 (8% viewport height)
```

Each marker claims a rectangle 16% × 8% of the viewport. This is very conservative — two markers 15% apart horizontally are rejected. At 6 budget slots, the map feels sparse.

### A.5 Marker Rendering

- **StableMarker**: `React.memo`, `tracksViewChanges` gating (true→false after 300ms)
- **ClinicMarkerView**: Bubble (max 140px, 11px bold text) + dot (12×12) + stagger padding
- **Two-layer render**: `{densityMarkers}{interactionMarker}` inside `<MapView>`
- **Interaction persistence**: `interactionIdRef` keeps last-tapped clinic visible until region change

### A.6 What's Working (must NOT regress)

| Feature | Mechanism |
|---------|-----------|
| Deterministic sort | `rawDistanceKm()` (full-precision) + `a.id < b.id` tiebreaker |
| No marker shift | `tracksViewChanges` gating → false after 300ms |
| Tap persistence | `interactionIdRef` survives `handleClosePreview` |
| Reference stability | `stableBaseApprovedIds` identity guard |
| Render-tree proof | Two-layer architecture, no Set merging |

### A.7 Installed but Unused

```
"react-native-map-clustering": "^4.0.0"
```
Uses **Supercluster** (Mapbox). Drop-in replacement for `react-native-maps` MapView. Supports `renderCluster`, `onClusterPress`, custom radius/minPoints, spider layout.

---

## B. Zoom-Tier Budget Strategy

### B.1 Design Philosophy

Airbnb's map follows **progressive disclosure**: show more markers as the user zooms in. At any zoom level, the map should feel "full but readable" — never sparse, never cluttered. When markers can't all be shown, a **cluster badge** tells users "there's more here."

### B.2 Proposed Budget Table

| Zoom Tier | Current Budget | **Proposed Budget** | Rationale |
|-----------|---------------|-------------------|-----------|
| 200 km | 2 | **8** | Country view — see major cities |
| 100 km | 2 | **10** | Region view — see all distinct areas |
| 50 km | 4 | **15** | Metro view — see neighborhoods |
| 25 km | 4 | **20** | City view — most clinics visible |
| 10 km | 6 | **30** | District view — nearly all visible |
| 5 km | 8 | **50** | Street view — show everything |

### B.3 Collision Box Reduction

Current boxes (16%W × 8%H) are too conservative for higher budgets. Proposed:

| Zoom Tier | Current Box | **Proposed Box** | Reduction |
|-----------|-------------|-----------------|-----------|
| 200 km | 16% × 8% | 12% × 6% | 25% smaller |
| 100 km | 16% × 8% | 12% × 6% | 25% smaller |
| 50 km | 16% × 8% | 10% × 5% | 37% smaller |
| 25 km | 16% × 8% | 9% × 4.5% | 44% smaller |
| 10 km | 16% × 8% | 8% × 4% | 50% smaller |
| 5 km | 16% × 8% | 7% × 3.5% | 56% smaller |

At close zoom, labels can be tighter because the map shows less area. Stagger padding already provides visual separation.

### B.4 Hysteresis (Anti-Flicker)

When zooming smoothly, the tier can oscillate at boundaries. Add ±10% hysteresis:

```
Current tier = 25 km
   Zoom in:  switch to 10 km when visibleKm < 17 × 0.9 = 15.3 km
   Zoom out: switch to 50 km when visibleKm > 37 × 1.1 = 40.7 km
```

Implementation: track `prevTier` in a ref. Only change tier when the new threshold is crossed by 10%.

### B.5 Option: Remove Custom Density Pipeline Entirely

**If we adopt `react-native-map-clustering` (Section C, Option A), the entire custom pipeline — `maxLabelsForTier`, `boxesOverlap`, `baseApprovedIds` — becomes unnecessary.** Supercluster handles viewport filtering, spatial indexing, and cluster formation natively. This is the recommended path.

---

## C. Dense-Area Clustering Algorithm

### The Core Problem

When multiple clinics occupy the same area (e.g., a medical district), the current system silently hides them. Users see no indication that hidden clinics exist. Airbnb solves this with **cluster markers**: a circle showing "+N" that zooms into the area on tap.

### Option A: `react-native-map-clustering` (Recommended)

**How it works**: Replace `<MapView>` from `react-native-maps` with `<MapView>` from `react-native-map-clustering`. It internally builds a Supercluster index from all `<Marker>` children and renders:
- **Individual markers** when spread apart at the current zoom
- **Cluster markers** when multiple markers overlap

**Integration approach:**

```tsx
// Before
import MapView, { Marker } from 'react-native-maps';

// After
import MapView from 'react-native-map-clustering';
import { Marker } from 'react-native-maps';
```

**Configuration:**

```tsx
<MapView
  clusteringEnabled={true}
  radius={60}           // px — tune to taste (default is ~6% of screen width)
  minPoints={2}         // 2 markers needed to form a cluster
  maxZoom={16}          // stop clustering at street level
  renderCluster={(cluster) => <ClusterMarker {...cluster} />}
  onClusterPress={handleClusterPress}
  preserveClusterPressBehavior={false}  // auto-zoom on tap
>
  {allFilteredMarkers}
</MapView>
```

**What we DELETE:**
- `maxLabelsForTier()`, `snapToZoomTier()`, `boxesOverlap()`
- `LABEL_BOX_W`, `LABEL_BOX_H`, all collision logic
- `baseApprovedIds` useMemo (the entire approval pipeline)
- `stableBaseApprovedIds` reference guard
- `densityMarkers` / `interactionMarker` split
- `prevApprovedIdsRef`
- All `_approval*` diagnostic code

**What we KEEP:**
- `filteredClinics` (geo valid + category + radius)
- `rawDistanceKm()` (may be used for sort in cluster expansion)
- `interactionIdRef` (for tap persistence — see Section D)
- `StableMarker` / `ClinicMarkerView` (individual marker rendering)
- `handleMarkerPress`, `handleClosePreview`, `ClinicBottomCard`
- `tracksViewChanges` gating in `StableMarker`

**Pros:**
- Battle-tested Supercluster algorithm (Mapbox)
- Native spatial indexing (KD-tree), handles 10,000+ points
- Cluster → individual transition is automatic
- Built-in spider/spiral for overlapping markers at max zoom
- Eliminates ~150 lines of custom pipeline code
- Drop-in for `react-native-maps` — same ref API

**Cons:**
- Third-party dependency (already installed, v4.0.0)
- Less control over exact marker selection order (distance-based priority lost)
- Cluster animation is iOS-only (`LayoutAnimation`)
- Need to verify `tracksViewChanges` gating still works for individual markers

### Option B: Custom Grid-Based Aggregation (Build Our Own)

**How it works**: Divide the viewport into a grid of cells (e.g., 8×6). Each cell either shows the nearest clinic marker or a cluster badge "+N".

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  ·  │     │ ·+2 │     │  ·  │     │     │  ·  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │  ·  │     │  ·  │     │ ·+3 │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ·  │     │     │     │  ·  │     │  ·  │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │ ·+4 │  ·  │     │     │     │  ·  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Algorithm:**
1. Divide viewport into NxM cells (N,M scale with zoom tier)
2. For each cell with >1 clinic: show nearest by distance, attach "+K" badge
3. For cells with 1 clinic: show normal marker
4. On zoom in: grid refines, clusters break apart naturally

**Pros:**
- Full control over selection order (distance-based)
- No external dependency
- Integrates naturally with existing pipeline
- Guaranteed even distribution

**Cons:**
- Must implement from scratch (~200-300 lines)
- Grid boundaries create hard cut lines
- Need to handle clinics on grid cell boundaries
- No spatial index — O(N) scan per cell
- No built-in spider layout

### Option C: Hybrid (Supercluster pipeline + Custom Markers)

Use Supercluster directly (not through react-native-map-clustering) as a computation engine, then render markers ourselves.

```
npm install supercluster
```

**How it works:**
1. Build Supercluster index from `filteredClinics`
2. On region change, query `getClusters(bbox, zoom)` → returns clusters + points
3. Render each result as either `<StableMarker>` or `<ClusterMarker>`
4. Keep full control over marker components and interaction

**Pros:**
- Best of both: spatial indexing + custom rendering
- Full control over what's shown
- Can layer interaction persistence on top
- Supercluster is tiny (~6 KB)

**Cons:**
- More integration code than Option A
- Must manage cluster expansion ourselves
- Must compute zoom level from latitudeDelta

### Recommendation: **Option A** (react-native-map-clustering)

Reasons:
1. Already installed and compatible
2. Eliminates most custom pipeline code (net LOC reduction)
3. Battle-tested with react-native-maps
4. Built-in cluster press → zoom behavior
5. Custom `renderCluster` gives us design control
6. Fastest path to Airbnb-grade UX

**Fallback**: If Option A has integration issues (e.g., conflicts with `tracksViewChanges` gating), fall back to Option C (Supercluster direct).

---

## D. Interaction Spec

### D.1 Cluster Marker Design

```
┌─────────────────┐
│   ┌─────────┐   │
│   │  +12    │   │   ← Frosted bubble, count in bold
│   └─────────┘   │
│       ●         │   ← Larger dot (16×16) in cluster color
└─────────────────┘
```

**Visual design:**
- Bubble: same frosted glass as individual markers, slightly larger padding
- Text: `+N` where N is cluster point count, font 13px bold
- Dot: 16×16 (larger than individual 12×12)
- Color: gradient from blue (#3D9EFF) → orange (#FF8C42) as N increases
  - 2-5: `#3D9EFF` (blue)
  - 6-15: `#7B61FF` (purple)
  - 16+: `#FF8C42` (orange)
- Shadow: slightly stronger than individual markers

### D.2 Cluster Tap Behavior

**Primary**: Auto-zoom to cluster bounds (built-in with `react-native-map-clustering`)

```
User taps cluster "+12"
  → Map animates to fitToCoordinates of all 12 children
  → Children either show individually or form smaller sub-clusters
  → Repeat until individual markers are visible
```

**Future enhancement (not v1)**: Bottom sheet listing cluster contents before zooming.

### D.3 Individual Marker Tap (unchanged)

```
User taps marker "Dr. Ahmad Clinic"
  → Bottom card slides up (ClinicBottomCard)
  → Marker highlighted (blue selection ring)
  → interactionIdRef set to clinic.id
```

### D.4 Close Preview (unchanged)

```
User taps ✕ on bottom card OR taps map background
  → Bottom card slides down
  → selectedClinic → null
  → interactionIdRef PRESERVED (marker stays visible until pan/zoom)
```

### D.5 Region Change (slight update)

```
User pans or zooms
  → After 350ms debounce: interactionIdRef → null
  → Supercluster recomputes visible clusters/markers
  → If previously-tapped clinic is now in a cluster, it shows as part of "+N"
```

### D.6 Edge Case: Interaction Persistence with Clustering

With Option A, the library manages which markers are visible. We lose `interactionIdRef` persistence because the library decides rendering.

**Proposed solution:**
1. On tap: store `interactionIdRef` as before
2. If the tapped clinic is inside a cluster at current zoom, force-show it as an individual marker *alongside* the cluster (cluster count decrements by 1)
3. This requires a small overlay — render the interaction marker *outside* the clustered MapView if cluster contains it

**Alternatively (simpler):** Don't persist interaction markers through zoom/pan in the clustered model. When the user zooms out and a clinic becomes part of a cluster, it naturally merges. The bottom card can remain open showing the clinic info, but the marker visually merges. This is how Airbnb handles it.

**Recommendation: simpler approach** — let clustering own rendering. On pan/zoom, close the bottom card (clear selectedClinic). This is cleaner UX.

### D.7 Zoom-to-Clinic from List

When navigating from the list screen to map with a specific clinic:
1. Receive `clinicId` via search params
2. Animate map to clinic's coordinates at tier 5 (closest zoom)
3. Auto-select the clinic (trigger `handleMarkerPress`)
4. This is unaffected by clustering since at close zoom, individual markers show

---

## E. Validation & Performance Plan

### E.1 Performance Requirements

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Marker render (initial) | < 500ms for 100 clinics | `performance.now()` around `useMemo` |
| Cluster recompute (pan) | < 100ms | Supercluster `getClusters()` is O(log N) |
| FPS during pan/zoom | ≥ 55 FPS | `__DEV__` FPS monitor |
| Memory (1000 clinics) | < 50 MB delta | React DevTools profiler |
| `tracksViewChanges` | false after mount | Visual inspection (no shimmer) |

### E.2 Supercluster Scaling

Supercluster uses a KD-tree spatial index. Benchmarks from the library:

| Points | Index Build | Query (getClusters) |
|--------|------------|-------------------|
| 1,000 | ~15ms | ~1ms |
| 10,000 | ~80ms | ~3ms |
| 100,000 | ~500ms | ~10ms |

For our use case (typically <500 clinics), performance is not a concern.

### E.3 Determinism Test Plan

| Test | Assertion | Method |
|------|-----------|--------|
| Same viewport → same markers | Markers don't change between renders at same region | Snapshot `onMarkersChange` output twice, compare |
| Pan then return → same markers | Returning to original viewport shows identical set | Record initial set, pan away, pan back, compare |
| Zoom in/out cycle → no drift | No markers creep in or disappear unexpectedly | Automated zoom cycle, log marker sets |
| Cluster tap → zoom in | `fitToCoordinates` called with child coords | Spy on mapRef method |

### E.4 UX Regression Tests

| Scenario | Expected | Current Behavior |
|----------|----------|-----------------|
| Tap marker → bottom card | Card slides up, marker highlights | ✅ Must preserve |
| Close card → marker persists | Marker stays until pan/zoom | ⚠️ Changes — with clustering, let rendering be owned by library |
| Tap cluster → zoom in | Map zooms to show children | 🆕 New behavior |
| Background tap → close card | Card slides down | ✅ Must preserve |
| Zoom out → markers merge | Individual markers → clusters | 🆕 New behavior |
| List → Map with clinicId | Zoom to clinic, auto-select | ✅ Must preserve |

### E.5 Platform Testing

| Platform | Key Concern | Test |
|----------|------------|------|
| iOS | `LayoutAnimation` cluster transitions | Verify smooth animation |
| Android | No `LayoutAnimation` — verify no crash | Set `animationEnabled={false}` on Android |
| Android | `tracksViewChanges` bitmap capture | Verify gating still works with clustered MapView |

### E.6 Rollback Safety

- Tag pre-implementation commit
- Feature flag: `const USE_CLUSTERING = true;`
- If false, fall back to current two-layer architecture
- Remove flag after 2 weeks of stable production

---

## F. Surgical Diff Plan

### F.1 Implementation Phases

#### Phase 1: Drop-in Clustering (Core)
**Estimated diff: ~-120 / +80 lines (net -40)**

1. **Change MapView import**
   ```diff
   - import MapView, { Marker, Region } from 'react-native-maps';
   + import MapView from 'react-native-map-clustering';
   + import { Marker, Region } from 'react-native-maps';
   ```

2. **Add `ClusterMarker` component** (~40 lines)
   - Frosted bubble with "+N" count
   - Color gradient based on count (blue → purple → orange)
   - Same shadow/blur treatment as `ClinicMarkerView`

3. **Replace MapView props**
   ```tsx
   <MapView
     // ... existing props
     clusteringEnabled={true}
     radius={60}
     minPoints={2}
     maxZoom={16}
     renderCluster={renderCluster}
     animationEnabled={Platform.OS === 'ios'}
     tracksViewChanges={false}
   >
     {allMarkers}  // flat list, no density/interaction split
   </MapView>
   ```

4. **Replace marker generation**
   ```diff
   - const densityMarkers = useMemo(() => { ... filtered by stableBaseApprovedIds ... });
   - const interactionMarker = useMemo(() => { ... });
   + const allMarkers = useMemo(() => {
   +   return filteredClinics.map((clinic) => (
   +     <StableMarker key={clinic.id} clinic={clinic} ... />
   +   ));
   + }, [filteredClinics, selectedId, isDark, handleMarkerPress]);
   ```

5. **Delete custom pipeline** (all of these become unnecessary):
   - `maxLabelsForTier()` function
   - `snapToZoomTier()` function
   - `boxesOverlap()` function
   - `LABEL_BOX_W`, `LABEL_BOX_H` constants
   - `baseApprovedIds` useMemo block (~50 lines)
   - `stableBaseApprovedIds` useMemo block (~15 lines)
   - `prevApprovedIdsRef` ref
   - `zoomTier`, `maxVisibleLabels` derived values
   - `_approvalRunCount`, `_isTracked()`, `_analyzeClinic()` diagnostics

6. **Simplify interaction model**
   - Remove `interactionIdRef` (clustering owns visibility)
   - `handleClosePreview`: just clears `selectedClinic`
   - On region change: no interaction cleanup needed

#### Phase 2: Cluster Visual Polish
**Estimated diff: +50 lines**

1. Animated cluster entrance (scale spring on mount)
2. Count-based color gradient
3. Dark mode support in cluster markers
4. Cluster size hint (bubble slightly larger for bigger clusters)

#### Phase 3: Tuning & Diagnostics
**Estimated diff: +30 lines**

1. Add dev-only cluster composition logging
2. Tune `radius` prop (test values 40-80 on real data)
3. Add `onMarkersChange` logging to verify determinism
4. Performance profiling on low-end Android

### F.2 Files Modified

| File | Changes |
|------|--------|
| `app/(tabs)/clinics/map.tsx` | Major refactor — delete custom pipeline, add clustering |
| (new) `src/components/ClusterMarker.tsx` | Cluster bubble component (~40 lines) |

### F.3 Files NOT Modified

| File | Reason |
|------|--------|
| `src/components/ClinicBottomCard.tsx` | Unchanged — same props interface |
| `src/utils/geoDistance.ts` | Unchanged — still used for radius filtering |
| `package.json` | Unchanged — `react-native-map-clustering` already installed |

### F.4 Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `tracksViewChanges` conflict with clustering lib | Low | Test immediately; fallback to Option C |
| Cluster press not zooming correctly | Low | Built-in behavior; test with `preserveClusterPressBehavior` |
| Android LayoutAnimation crash | Medium | Disable animation on Android (`animationEnabled={Platform.OS === 'ios'}`) |
| Marker selection lost during cluster merge | Low | Accept as design change (Airbnb model) |
| Supercluster ref forwarding issues | Low | Use `mapRef` prop instead of `ref` |

---

## Summary

| Aspect | Current | Proposed |
|--------|---------|----------|
| Density at far zoom | 2 markers | 8-10 markers + clusters |
| Density at close zoom | 8 markers | Unlimited (all visible) |
| Hidden clinics | Silent — no affordance | Cluster "+N" badges |
| Collision resolution | Manual box overlap | Supercluster KD-tree |
| Dense-area behavior | Drop excess markers | Group into clusters |
| Cluster tap | N/A | Zoom to bounds |
| Lines of custom pipeline | ~150 | ~0 (deleted) |
| Dependency | None | `react-native-map-clustering` (already installed) |

**The single biggest UX win is replacing "silent marker hiding" with "visible cluster badges."** Users will always know how many clinics exist in an area, and can tap to explore.

---

*Awaiting approval before implementation begins.*
