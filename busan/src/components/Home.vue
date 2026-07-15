<script setup>
import { computed, onMounted, ref } from 'vue'
import festivalsData from '../assets/festivals.json'
import attractionsData from '../assets/attractions.json'

// 💡 Vite 환경에서 경로 에러가 나지 않도록 이미지를 코드로 직접 안전하게 가져옵니다.
import busanMapImage from '../assets/busan-map.png'

const emit = defineEmits(['select-festival'])

// 원본 파일의 구·군 좌표 데이터 유지
const regionCoords = [
  { name: '강서구', left: 22.8, top: 64.9 },
  { name: '금정구', left: 57.6, top: 33.7 },
  { name: '기장군', left: 77.7, top: 25.8 },
  { name: '남구', left: 59.4, top: 65.2 },
  { name: '동구', left: 50.6, top: 64.4 },
  { name: '동래구', left: 56.3, top: 44.5 },
  { name: '부산진구', left: 49.9, top: 56.0 },
  { name: '북구', left: 45.8, top: 41.4 },
  { name: '사상구', left: 39.6, top: 57.2 },
  { name: '사하구', left: 38.9, top: 74.8 },
  { name: '서구', left: 44.6, top: 66.7 },
  { name: '수영구', left: 62, top: 55.1 },
  { name: '연제구', left: 56.6, top: 49.9 },
  { name: '영도구', left: 53.9, top: 75.6 },
  { name: '중구', left: 48.1, top: 69.3 },
  { name: '해운대구', left: 69.2, top: 49.8 }
]

const selectedRegion = ref(null) // 마우스 클릭으로 '고정 선택'된 지역
const hoveredRegion = ref(null)   // 마우스 호버로 '임시 탐색' 중인 지역

const likesMeta = ref({})
const festivalItems = ref([])
const isDataLoaded = ref(false)
const dataLoadError = ref(null)

function summarizeText(text, limit = 70) {
  if (!text) return '부산의 대표적인 여행 포인트를 직접 확인해보세요.'

  const cleaned = String(text).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned.length > limit ? `${cleaned.slice(0, limit)}...` : cleaned
}

const featuredItems = computed(() => {
  const festivalHighlights = (festivalsData?.items ?? [])
    .filter((item) => item?.firstimage || item?.firstimage2)
    .slice(0, 2)
    .map((item) => ({
      type: '축제',
      title: item.title || '부산 축제',
      description: summarizeText(item.program, 60),
      image: item.firstimage || item.firstimage2 || '',
      contentid: item.contentid
    }))

  const attractionHighlights = (attractionsData?.items ?? [])
    .filter((item) => item?.firstimage || item?.firstimage2)
    .slice(0, 2)
    .map((item) => ({
      type: '관광지',
      title: item.title || '부산 명소',
      description: summarizeText(item.addr1 || '부산의 대표 명소를 직접 만나보세요.', 60),
      image: item.firstimage || item.firstimage2 || '',
      contentid: item.contentid
    }))

  return [...festivalHighlights, ...attractionHighlights]
})

// 💡 로컬 스토리지에 저장된 실시간 좋아요 메타 정보 가져오기
function loadLikesMeta() {
  if (typeof window === 'undefined') return

  try {
    const raw = window.localStorage.getItem('busan-festival-likes-meta-v2')

    if (raw) {
      likesMeta.value = JSON.parse(raw)
    } else {
      const fallback = {}
      const items = festivalsData?.items ?? []

      // 처음 접속 시 기본 하트 개수는 모두 0개로 깨끗하게 설정합니다.
      items.forEach((item) => {
        fallback[String(item.contentid)] = 0
      })

      likesMeta.value = fallback
      window.localStorage.setItem('busan-festival-likes-meta-v2', JSON.stringify(fallback))
    }
  } catch {
    likesMeta.value = {}
  }
}

function getLikeCount(contentid) {
  const value = likesMeta.value?.[String(contentid)]
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// 💡 주소에 구 이름이 포함되어 있는 축제들을 필터링합니다.
function getFestivalsByRegion(regionName) {
  return festivalItems.value.filter((item) => item?.addr1?.includes(regionName))
}

// 💡 지도 마커 클릭 시 동작 제어 (이미 선택된 곳을 다시 클릭하면 선택 해제)
function handleMarkerClick(regionName) {
  if (selectedRegion.value === regionName) {
    selectedRegion.value = null
    return
  }
  selectedRegion.value = regionName
}

// 💡 축제 카드를 클릭하면 상세페이지로 ID를 던져주는 이벤트 발생
function selectFestival(contentid) {
  emit('select-festival', String(contentid))
}

function handleFeaturedCardClick(item) {
  if (item?.type === '축제' && item.contentid) {
    selectFestival(item.contentid)
  }
}

// 💡 클릭(고정) 혹은 호버(임시)된 타겟 지역의 축제들을 실시간 좋아요 '인기 내림차순'으로 정렬합니다.
const filteredAndSortedFestivals = computed(() => {
  const targetRegion = selectedRegion.value || hoveredRegion.value
  if (!targetRegion) return []

  return getFestivalsByRegion(targetRegion)
    .map((item) => ({ ...item, likeCount: getLikeCount(item.contentid) }))
    .sort((a, b) => {
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount // 좋아요 많은 순 정렬
      }
      return (a.title || '').localeCompare(b.title || '') // 동점일 경우 가나다순 정렬
    })
})

const totalFestivalCount = computed(() => {
  return festivalsData?.total && festivalsData.total > 0 ? festivalsData.total : festivalItems.value.length
})

onMounted(() => {
  festivalItems.value = festivalsData?.items ?? []
  isDataLoaded.value = true
  loadLikesMeta()
})
</script>

<template>
  <div class="app-layout">
    <div class="split">
      <!-- =========================
           좌측 지도 영역
      ========================== -->
      <aside class="map-area">
        <div class="map-header">
          <h1>부산 축제 지도</h1>
          <p>지도를 클릭하면 지역별 축제 정보를 확인할 수 있어요</p>
        </div>

        <div class="hint-box" aria-hidden="true">
          <i class="fa-solid fa-circle-info" style="color: #0f1724;"></i>
          <span>원하는 지역을 클릭해보세요</span>
        </div>

        <section class="intro-card" aria-label="부산 여행 소개">
          <div class="intro-copy">
            <p class="section-label">부산 여행의 시작</p>
            <h2>바다와 밤의 감성, 축제와 명소가 함께 펼쳐지는 부산</h2>
            <p>
              해운대의 바다, 광안리의 야경, 지역 축제와 다양한 명소까지 한눈에 확인해보세요.
              지도를 살펴보며 여행 계획을 짜고, 마음에 드는 축제를 바로 탐색해보세요.
            </p>
          </div>
        </section>
        <section id="map-container" aria-label="부산 지도">
          <div id="map-coordinate-wrapper">
            <img :src="busanMapImage" alt="부산 16개 구·군 지도" />
            
            <div id="marker-layer" aria-hidden="false">
              <!-- 💡 마우스 호버와 클릭 이벤트를 분리하여 데이터 오버랩 버그를 해결했습니다. -->
              <button
                v-for="region in regionCoords"
                :key="region.name"
                type="button"
                class="region-marker"
                :class="{ selected: selectedRegion === region.name }"
                :data-region="region.name"
                :style="{ left: `${region.left}%`, top: `${region.top}%` }"
                :aria-label="`${region.name} 선택`"
                @click="handleMarkerClick(region.name)"
                @mouseenter="hoveredRegion = region.name"
                @mouseleave="hoveredRegion = null"
              />
            </div>
          </div>
        </section>

        <div class="tip-row">
          <i class="fa-solid fa-location-dot"></i>
          <small>💡 TIP. 마우스를 올리면 지역명을 확인할 수 있어요</small>
        </div>
      </aside>

      <!-- =========================
           우측 축제 정보 패널
      ========================== -->
      <aside class="panel-area" role="region" aria-label="축제 정보 패널">
        <div class="panel-header">
          <div class="panel-title-block">
            <strong>축제 정보</strong>
            <span>선택된 지역의 축제 정보를 확인하세요</span>
          </div>

          <div class="badge">전체 축제 {{ totalFestivalCount }}</div>
        </div>

        <div class="panel-body">
          <!-- 1. 로딩 상태 -->
          <div v-if="!isDataLoaded" class="empty-card">
            <div class="empty-card-inner">
              <div class="empty-icon"><i class="fa-solid fa-spinner fa-spin"></i></div>
              <h3>축제 데이터를 불러오는 중입니다.</h3>
              <p>잠시만 기다려주세요.</p>
            </div>
          </div>

          <!-- 2. 오류 상태 -->
          <div v-else-if="dataLoadError" class="empty-card">
            <div class="empty-card-inner">
              <div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
              <h3>데이터를 불러오지 못했습니다</h3>
              <p>{{ dataLoadError }}</p>
            </div>
          </div>

          <!-- 3. 초기 기본 상태 (아무 행동도 안 하고 있을 때) -->
          <div v-else-if="!selectedRegion && !hoveredRegion" class="empty-card" aria-live="polite">
            <div class="empty-card-inner">
              <div class="empty-icon"><i class="fa-regular fa-calendar"></i></div>
              <h3>지역을 선택해주세요</h3>
              <p>지도를 클릭하면 해당 지역의 축제 목록이 표시됩니다.</p>
            </div>
          </div>

          <!-- 4. 호버 미리보기 상태 (선택된 구가 없는데 마우스만 마커에 올렸을 때) -->
          <div v-else-if="!selectedRegion && hoveredRegion" class="empty-card" aria-live="polite">
            <div class="empty-card-inner">
              <div class="empty-icon"><i class="fa-solid fa-circle-info"></i></div>
              <h3>{{ hoveredRegion }} 축제 {{ getFestivalsByRegion(hoveredRegion).length }}개</h3>
              <p>클릭하면 해당 지역의 축제 목록을 확인할 수 있습니다.</p>
            </div>
          </div>

          <!-- 5. 클릭 고정 상태 (구가 선택되어 리스트를 안정적으로 출력할 때) -->
          <div v-else class="region-selected">
            <div class="region-head">
              <h4>{{ selectedRegion }} 축제</h4>
              <p>선택한 지역의 축제 정보를 확인하세요</p>
            </div>

            <div v-if="filteredAndSortedFestivals.length === 0" class="empty-card">
              <div class="empty-card-inner">
                <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                <h3>{{ selectedRegion }} 축제</h3>
                <p>현재 이 지역에 등록된 축제·행사 데이터가 없습니다.</p>
              </div>
            </div>

            <div v-else class="festival-list">
              <article
                v-for="item in filteredAndSortedFestivals"
                :key="item.contentid"
                class="festival-card"
                @click="selectFestival(item.contentid)"
              >
                <div class="card-inner">
                  <img
                    v-if="item.firstimage || item.firstimage2"
                    :src="item.firstimage || item.firstimage2"
                    :alt="item.title || '축제 대표 이미지'"
                    loading="lazy"
                  />
                  <div v-else class="festival-image-placeholder">
                    <i class="fa-regular fa-image"></i>
                  </div>

                  <div class="card-info">
                    <div class="card-title-row">
                      <h5>{{ item.title || '제목 없음' }}</h5>
                      <div class="like-badge">
                        <span>❤️</span>
                        <span>{{ item.likeCount }}</span>
                      </div>
                    </div>
                    <div class="addr">{{ [item.addr1, item.addr2].filter(Boolean).join(' ') }}</div>
                    <div v-if="item.tel" class="tel">전화: {{ item.tel }}</div>
                    <div class="festival-type-badge">축제·행사</div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* 💡 Scoped 설정을 통해 전역 스타일과의 오염을 방지하고 이 컴포넌트만의 유니크한 레이아웃을 보장합니다. */
.app-layout {
  --panel-radius: 14px;
  --muted: #f8fafc;
  --panel-border: #e6e9ee;
  --title-color: #0f1724;
  --text-muted: #64748b;
  --accent: #0ea5e9;

  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: var(--muted);
  color: var(--title-color);
}

.split {
  display: flex;
  width: 100%;
  flex: 1 1 auto;
  gap: 0;
}

/* 좌측 지도 영역 */
.map-area {
  display: flex;
  box-sizing: border-box;
  flex-basis: 62%;
  flex-direction: column;
  gap: 16px;
  padding: 28px;
  background: #fff;
}

.map-header h1 {
  margin: 0;
  color: var(--title-color);
  font-size: 20px;
  font-weight: 700;
}

.map-header p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.hint-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  color: var(--text-muted);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.04);
  font-size: 13px;
}

 .intro-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fbff 0%, #eef7ff 100%);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.04);
}

.section-label {
  margin: 0;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.intro-copy h2 {
  margin: 4px 0 8px;
  color: var(--title-color);
  font-size: 20px;
  line-height: 1.35;
}

.intro-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.intro-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.08);
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
}

.feature-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(2, 6, 23, 0.04);
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(2, 6, 23, 0.08);
}

.feature-image {
  height: 132px;
  background: #f8fafc;
}

.feature-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feature-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 22px;
}

.feature-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 12px 12px 14px;
}

.feature-tag {
  display: inline-flex;
  width: fit-content;
  padding: 4px 8px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  background: #f8fafc;
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
}

.feature-body h3 {
  margin: 0;
  color: var(--title-color);
  font-size: 15px;
  line-height: 1.35;
}

.feature-body p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

#map-container {
  position: relative;
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border-radius: 8px;
  background: #fff;
}

#map-coordinate-wrapper {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  width: 100%;
  max-width: 960px;
}

#map-coordinate-wrapper img {
  display: block;
  width: 100%;
  height: auto;
  margin: 0;
  padding: 0;
}

#marker-layer {
  position: absolute;
  z-index: 2;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 지도 마커 */
.region-marker {
  position: absolute;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
}

.region-marker::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  content: '';
  border: 1.5px solid rgba(6, 21, 40, 0.08);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 6px 14px rgba(2, 6, 23, 0.1);
  transform: translate(-50%, -50%) scale(1);
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.region-marker:hover::before {
  background: rgba(14, 165, 233, 0.95);
  box-shadow: 0 0 0 8px rgba(14, 165, 233, 0.14), 0 8px 18px rgba(2, 6, 23, 0.14);
  transform: translate(-50%, -50%) scale(1.35);
}

.region-marker.selected::before {
  background: rgba(3, 105, 161, 0.95);
  box-shadow: 0 0 0 8px rgba(3, 105, 161, 0.18), 0 10px 22px rgba(2, 6, 23, 0.16);
  transform: translate(-50%, -50%) scale(1.45);
}

.region-marker::after {
  position: absolute;
  z-index: 20;
  top: -8px;
  left: 50%;
  padding: 6px 8px;
  color: #fff;
  content: attr(data-region);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.88);
  font-size: 12px;
  opacity: 0;
  white-space: nowrap;
  transform: translate(-50%, -100%) scale(0);
  transform-origin: bottom center;
  transition: transform 0.12s ease, opacity 0.12s ease;
}

.region-marker:hover::after,
.region-marker.selected::after {
  opacity: 1;
  transform: translate(-50%, -100%) scale(1);
}

/* 우측 정보 패널 */
.panel-area {
  display: flex;
  box-sizing: border-box;
  flex-basis: 38%;
  flex-direction: column;
  padding: 20px;
  border-left: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: -8px 0 24px rgba(2, 6, 23, 0.04);
}

.panel-header {
  position: sticky;
  z-index: 5;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
  background: transparent;
}

.panel-title-block {
  display: flex;
  flex-direction: column;
}

.panel-title-block strong {
  font-size: 16px;
}

.panel-title-block span {
  color: var(--text-muted);
  font-size: 12px;
}

.panel-body {
  height: calc(100vh - 140px);
  margin-top: 12px;
  padding-right: 6px;
  overflow: auto;
}

.empty-card {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  padding: 22px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(2, 6, 23, 0.04);
}

.empty-card-inner {
  text-align: center;
}

.empty-icon {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 28px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  color: var(--title-color);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
}

/* 축제 카드 */
.festival-card > .card-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid rgba(15, 23, 42, 0.04);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.04);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.festival-card > .card-inner:hover {
  box-shadow: 0 12px 26px rgba(2, 6, 23, 0.06);
  transform: translateY(-4px);
}

.festival-card img {
  width: 120px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
  object-fit: cover;
}

.card-info {
  flex: 1 1 auto;
}

.card-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-info h5 {
  max-height: 2.6em;
  margin: 0 0 6px;
  overflow: hidden;
  color: var(--title-color);
  font-size: 16px;
  line-height: 1.2;
}

.like-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 6px 9px;
  border: 1px solid rgba(244, 63, 94, 0.2);
  border-radius: 999px;
  background: rgba(244, 63, 94, 0.08);
  color: #db2777;
  font-size: 12px;
  font-weight: 700;
}

.festival-card .addr,
.festival-card .tel {
  max-height: 3em;
  margin-bottom: 6px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 13px;
}

.festival-type-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 8px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
}

.festival-image-placeholder {
  display: flex;
  width: 120px;
  height: 80px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 8px;
  background: #f1f5f9;
  font-size: 20px;
}

.tip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.tip-row i {
  color: var(--text-muted);
  font-size: 12px;
}

.region-selected {
  display: block;
  margin-top: 6px;
}

.region-head {
  padding: 12px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}

.region-head h4 {
  margin: 0;
  color: var(--title-color);
  font-size: 18px;
}

.region-head p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

/* 반응형 모바일 브레이크 포인트 적용 */
@media (max-width: 1023px) {
  .split {
    flex-direction: column;
  }

  .map-area,
  .panel-area {
    width: 100%;
    flex-basis: auto;
    padding: 16px;
  }

  .panel-body {
    height: auto;
    overflow: visible;
  }

  .intro-card {
    padding: 16px;
  }

  .feature-strip {
    grid-template-columns: 1fr;
  }

  .feature-image {
    height: 170px;
  }

  #map-container {
    padding: 12px;
    border-radius: 10px;
  }

  #map-coordinate-wrapper {
    max-width: 100%;
  }

  .festival-card > .card-inner {
    align-items: stretch;
    flex-direction: column;
  }

  .festival-card img,
  .festival-image-placeholder {
    width: 100%;
    height: 180px;
  }
}
</style>