<script setup>
import { computed, onMounted, ref } from 'vue'
import festivalsData from '../assets/festivals.json'
import busanMapImage from '../assets/busan-map.png'

const emit = defineEmits(['select-festival'])

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
const showAllView = ref(false)     // 💡 전체 축제 목록을 페이지처럼 풀스크린으로 볼지 여부

const likesMeta = ref({})
const festivalItems = ref([])
const isDataLoaded = ref(false)
const dataLoadError = ref(null)

const activeRegion = computed(() => {
  return selectedRegion.value || hoveredRegion.value
})

function loadLikesMeta() {
  if (typeof window === 'undefined') return

  try {
    const raw = window.localStorage.getItem('busan-festival-likes-meta-v2')

    if (raw) {
      likesMeta.value = JSON.parse(raw)
    } else {
      const fallback = {}
      const items = festivalsData?.items ?? []

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

function getFestivalsByRegion(regionName) {
  return festivalItems.value.filter((item) => item?.addr1?.includes(regionName))
}

function handleMarkerClick(regionName) {
  showAllView.value = false // 다른 구를 누르면 전체보기 탈출
  if (selectedRegion.value === regionName) {
    selectedRegion.value = null
    return
  }
  selectedRegion.value = regionName
}

function selectFestival(contentid) {
  emit('select-festival', String(contentid))
}

// YYYYMMDD 날짜 포맷 함수
function formatDate(dateStr) {
  if (!dateStr) return '미정'
  return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`
}

// 💡 축제의 실시간 진행 상태 및 스타일 배지 반환 함수
function getFestivalStatus(item) {
  const todayStr = '20260715' // 현재 시스템 타임스탬프 기준
  if (!item.eventstartdate || !item.eventenddate) return { text: '일정 미정', class: 'bg-slate-800 text-slate-400' }
  if (item.eventenddate < todayStr) return { text: '종료된 행사', class: 'bg-slate-950/80 text-slate-500 border border-slate-800' }
  if (item.eventstartdate <= todayStr && item.eventenddate >= todayStr) return { text: '🥳 진행 중!', class: 'bg-emerald-500 text-white' }
  return { text: '📅 진행 예정', class: 'bg-cyan-500 text-white' }
}

// 구별 필터링용 소스
const filteredAndSortedFestivals = computed(() => {
  if (!activeRegion.value) return []

  return getFestivalsByRegion(activeRegion.value)
    .map((item) => ({ ...item, likeCount: getLikeCount(item.contentid) }))
    .sort((a, b) => {
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount
      }
      return (a.title || '').localeCompare(b.title || '')
    })
})

// 💡 요구사항 반영: [진행중/예정 ➡️ 시작일 가까운 순] 먼저 배치 후 [종료됨 ➡️ 최근 종료 순] 결합 정렬
const allSortedFestivals = computed(() => {
  const todayStr = '20260715'
  
  const upcomingOrOngoing = []
  const ended = []

  festivalItems.value.forEach(item => {
    const mappedItem = { ...item, likeCount: getLikeCount(item.contentid) }
    if (!item.eventenddate || item.eventenddate >= todayStr) {
      upcomingOrOngoing.push(mappedItem)
    } else {
      ended.push(mappedItem)
    }
  })

  // 1. 아직 종료되지 않은 행사: 시작일이 가까운 순(오름차순)
  upcomingOrOngoing.sort((a, b) => {
    if (a.eventstartdate !== b.eventstartdate) {
      return (a.eventstartdate || '').localeCompare(b.eventstartdate || '')
    }
    return (a.title || '').localeCompare(b.title || '')
  })

  // 2. 이미 종료된 행사: 최근에 종료된 순(내림차순)
  ended.sort((a, b) => {
    if (b.eventenddate !== a.eventenddate) {
      return (b.eventenddate || '').localeCompare(a.eventenddate || '')
    }
    return (a.title || '').localeCompare(b.title || '')
  })

  // 두 그룹을 위아래로 결합
  return [...upcomingOrOngoing, ...ended]
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
    
    <!-- 🌟 1. 요구사항 반영: 전체 축제 목록 풀페이지 뷰 모드 (상세페이지처럼 전체화면 장악) -->
    <div v-if="showAllView" class="full-screen-festivals bg-slate-950 min-h-screen text-white px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-6">
        
        <!-- 대화형 탑바 -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 class="text-2xl font-black text-white flex items-center gap-2">
              ✨ 부산 축제 전체 타임라인
            </h1>
            <p class="text-xs text-slate-400 mt-1">
              현재 진행 중이거나 다가오는 축제가 먼저 나오며, 종료된 행사는 최근 종료 순서대로 하단에 배치됩니다.
            </p>
          </div>
          <button 
            type="button" 
            class="rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold hover:border-cyan-400 hover:text-cyan-400 transition whitespace-nowrap self-start sm:self-auto"
            @click="showAllView = false"
          >
            🗺️ 지도 보기로 돌아가기
          </button>
        </div>

        <!-- 3열 와이드 그리드 플레이트 -->
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="item in allSortedFestivals"
            :key="item.contentid"
            class="group bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-cyan-500/40 hover:bg-slate-900/80 transition duration-300 cursor-pointer flex flex-col shadow-lg"
            @click="selectFestival(item.contentid)"
          >
            <!-- 썸네일 존 -->
            <div class="relative w-full h-48 bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                v-if="item.firstimage || item.firstimage2"
                :src="item.firstimage || item.firstimage2"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
              <div v-else class="text-slate-700 text-3xl">
                <i class="fa-regular fa-image"></i>
              </div>
              
              <!-- 동적 진행 상태 배지 -->
              <span 
                class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide shadow-md"
                :class="getFestivalStatus(item).class"
              >
                {{ getFestivalStatus(item).text }}
              </span>
            </div>

            <!-- 디테일 텍스트 존 -->
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <h5 class="font-bold text-base text-slate-100 group-hover:text-cyan-400 transition line-clamp-1">
                    {{ item.title }}
                  </h5>
                  <span class="text-xs font-bold text-rose-400 flex items-center gap-1 shrink-0 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    ❤️ {{ item.likeCount }}
                  </span>
                </div>
                
                <p class="text-xs text-cyan-400 font-semibold font-mono">
                  🗓️ {{ formatDate(item.eventstartdate) }} ~ {{ formatDate(item.eventenddate) }}
                </p>
              </div>
              <p class="text-xs text-slate-400 line-clamp-1 border-t border-slate-800/60 pt-2">
                📍 {{ item.addr1 }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- 🌟 2. 기존 지도 분할화면 대시보드 모드 (showAllView가 꺼져있을 때 출력) -->
    <div v-else class="split">
      <!-- 좌측 지도 영역 -->
      <aside class="map-area">
        <div class="map-header">
          <h1>부산 축제 지도</h1>
          <p>지도를 클릭하면 지역별 축제 정보를 확인할 수 있어요</p>
        </div>

        <div class="hint-box" aria-hidden="true">
          <i class="fa-solid fa-circle-info" style="color: #0f1724;"></i>
          <span>원하는 지역을 클릭해보세요</span>
        </div>

        <section id="map-container" aria-label="부산 지도">
          <div id="map-coordinate-wrapper">
            <img :src="busanMapImage" alt="부산 16개 구·군 지도" />
            
            <div id="marker-layer" aria-hidden="false">
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
          <small>TIP. 마우스를 올리면 지역명을 확인할 수 있어요</small>
        </div>
      </aside>

      <!-- 우측 축제 정보 패널 -->
      <aside class="panel-area" role="region" aria-label="축제 정보 패널">
        <div class="panel-header">
          <div class="panel-title-block">
            <strong>축제 정보</strong>
            <span>선택된 지역의 축제 정보를 확인하세요</span>
          </div>

          <!-- 클릭 시 풀페이지 전체보기 모드로 넘어가도록 바인딩 -->
          <div 
            class="badge cursor-pointer hover:bg-slate-100 hover:text-cyan-600 border hover:border-cyan-400 active:scale-95 transition-all"
            @click="showAllView = true"
          >
            전체 축제 {{ totalFestivalCount }}
          </div>
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

          <!-- 3. 초기 기본 상태 -->
          <div v-else-if="!activeRegion" class="empty-card" aria-live="polite">
            <div class="empty-card-inner">
              <div class="empty-icon"><i class="fa-regular fa-calendar"></i></div>
              <h3>지역을 선택해주세요</h3>
              <p>지도를 클릭하면 해당 지역의 축제 목록이 표시됩니다.</p>
            </div>
          </div>

          <!-- 4. 클릭 고정 상태 -->
          <div v-else class="region-selected">
            <div class="region-head">
              <h4>{{ activeRegion }} 축제</h4>
              <p>선택한 지역의 축제 정보를 확인하세요</p>
            </div>

            <div v-if="filteredAndSortedFestivals.length === 0" class="empty-card">
              <div class="empty-card-inner">
                <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
                <h3>{{ activeRegion }} 축제</h3>
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