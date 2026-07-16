<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import festivalsData from '../assets/festivals.json'
import attractionsData from '../assets/attractions.json'
import accommodationsData from '../assets/accommodations.json'

const props = defineProps({
  selectedContentId: {
    type: String,
    default: ''
  }
})

const mapContainer = ref(null)
const map = shallowRef(null)
const nearbyLayerGroup = shallowRef(null)
const baseMarkerLayer = shallowRef(null)
const filter = ref('all')
const loading = ref(true)
const selectedFestival = ref(null)

const festivalItems = ref([])
const attractionItems = ref([])
const accommodationItems = ref([])

function parseCoordinate(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180
  const R = 6371

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function findSelectedFestival() {
  const targetId = (props.selectedContentId || '').trim()

  const matched = festivalItems.value.find((item) => item.contentid === targetId)
  if (matched) return matched

  const fallback = festivalItems.value.find((item) => item.contentid === '506545')
  return fallback || festivalItems.value[0] || null
}

function createMarkerIcon(color, size = 30) {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center rounded-full border-2 border-white shadow-lg" style="width:${size}px;height:${size}px;background:${color};">
        <div class="h-2.5 w-2.5 rounded-full bg-white"></div>
      </div>
    `,
    className: 'custom-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

function createPopupHtml(item) {
  const imageHtml = item.firstimage
    ? `<img src="${item.firstimage}" alt="${item.title}" class="mt-2 h-24 w-full rounded-lg object-cover" />`
    : ''

  return `
    <div class="min-w-[220px] max-w-[260px] rounded-2xl bg-white p-2 text-slate-800 shadow-xl">
      <div class="font-semibold text-sm">${item.title || '장소 이름'}</div>
      <div class="mt-1 text-xs leading-5 text-slate-600">${item.addr1 || '주소 정보 없음'}</div>
      ${imageHtml}
    </div>
  `
}

function renderNearbyMarkers() {
  if (!map.value || !selectedFestival.value) return

  nearbyLayerGroup.value?.clearLayers()

  const baseLat = parseCoordinate(selectedFestival.value.mapy)
  const baseLng = parseCoordinate(selectedFestival.value.mapx)

  if (baseLat === null || baseLng === null) return

  const visibleItems = []

  if (filter.value === 'all' || filter.value === 'attraction') {
    attractionItems.value.forEach((item) => {
      const lat = parseCoordinate(item.mapy)
      const lng = parseCoordinate(item.mapx)

      if (lat === null || lng === null) return

      const distance = haversineKm(baseLat, baseLng, lat, lng)
      if (distance <= 5) {
        visibleItems.push({ item, type: 'attraction' })
      }
    })
  }

  if (filter.value === 'all' || filter.value === 'accommodation') {
    accommodationItems.value.forEach((item) => {
      const lat = parseCoordinate(item.mapy)
      const lng = parseCoordinate(item.mapx)

      if (lat === null || lng === null) return

      const distance = haversineKm(baseLat, baseLng, lat, lng)
      if (distance <= 5) {
        visibleItems.push({ item, type: 'accommodation' })
      }
    })
  }

  visibleItems.forEach(({ item, type }) => {
    const lat = parseCoordinate(item.mapy)
    const lng = parseCoordinate(item.mapx)

    if (lat === null || lng === null) return

    const iconColor = type === 'attraction' ? '#22c55e' : '#8b5cf6'

    const marker = L.marker([lat, lng], {
      icon: createMarkerIcon(iconColor, 30)
    }).bindPopup(createPopupHtml(item))

    marker.addTo(nearbyLayerGroup.value)
  })
}

function renderBaseFestivalMarker() {
  if (!map.value || !selectedFestival.value) return

  const lat = parseCoordinate(selectedFestival.value.mapy)
  const lng = parseCoordinate(selectedFestival.value.mapx)

  if (lat === null || lng === null) return

  const festivalIcon = L.divIcon({
    html: `
      <div class="flex items-center justify-center rounded-full border-4 border-white shadow-2xl" style="width:38px;height:38px;background:#ef4444;">
        <div class="h-3.5 w-3.5 rounded-full bg-white"></div>
      </div>
    `,
    className: 'festival-pin',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  })

  const marker = L.marker([lat, lng], { icon: festivalIcon }).bindPopup(
    `<div class="min-w-[220px] rounded-2xl bg-white p-2 text-slate-800 shadow-xl">
      <div class="font-semibold text-sm">${selectedFestival.value.title || '축제 이름'}</div>
      <div class="mt-1 text-xs text-slate-600">${selectedFestival.value.addr1 || '주소 정보 없음'}</div>
    </div>`
  )

  marker.addTo(baseMarkerLayer.value)
}

function initializeMap() {
  // 항상 mapContainer가 생성되어 있으므로 정상 작동합니다.
  if (!mapContainer.value) return

  if (map.value) {
    map.value.remove()
    map.value = null
  }

  selectedFestival.value = findSelectedFestival()

  if (!selectedFestival.value) {
    loading.value = false
    return
  }

  const baseLat = parseCoordinate(selectedFestival.value.mapy)
  const baseLng = parseCoordinate(selectedFestival.value.mapx)

  if (baseLat === null || baseLng === null) {
    loading.value = false
    return
  }

  // 지도 생성
  map.value = L.map(mapContainer.value, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([baseLat, baseLng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)

  nearbyLayerGroup.value = L.layerGroup().addTo(map.value)
  baseMarkerLayer.value = L.layerGroup().addTo(map.value)

  renderBaseFestivalMarker()
  renderNearbyMarkers()

  // 모든 맵 세팅이 끝난 후 로딩을 종료합니다.
  loading.value = false

  nextTick(() => {
    map.value?.invalidateSize()
  })
}

watch(filter, () => {
  renderNearbyMarkers()
})

watch(
  // 대소문자가 섞인 유동적인 키 처리를 보장
  () => props.selectedContentId,
  () => {
    initializeMap()
  }
)

onMounted(() => {
  festivalItems.value = festivalsData?.items ?? []
  attractionItems.value = attractionsData?.items ?? []
  accommodationItems.value = accommodationsData?.items ?? []

  nextTick(() => {
    initializeMap()
  })
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
  nearbyLayerGroup.value = null
  baseMarkerLayer.value = null
})

function filterButtonClass(value) {
  return [
    'rounded-full border px-3 py-2 text-sm font-semibold transition',
    filter.value === value
      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20'
      : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:text-white'
  ].join(' ')
}
</script>

<template>
  <div class="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-black/30 backdrop-blur">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-slate-900">주변 탐색 지도</h2>
        <p class="text-sm text-slate-500">
          기준 축제 위치에서 반경 5km 이내의 관광지와 숙소를 확인해보세요.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" :class="filterButtonClass('all')" @click="filter = 'all'">
          [전체 보기]
        </button>
        <button type="button" :class="filterButtonClass('attraction')" @click="filter = 'attraction'">
          [🏖️ 주변 관광지]
        </button>
        <button type="button" :class="filterButtonClass('accommodation')" @click="filter = 'accommodation'">
          [🏨 주변 숙소]
        </button>
      </div>
    </div>

    <!-- 💡 수정된 핵심 영역: 지도는 항상 켜두고 그 위에 로딩 레이어를 올립니다. -->
    <div class="relative h-[480px] w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/60">
      
      <!-- 실제 지도 박스 (항상 렌더링 상태 유지) -->
      <div ref="mapContainer" class="h-full w-full" />

      <!-- 로딩 오버레이 (loading이 true일 때만 지도 위를 완전히 덮음) -->
      <div
        v-if="loading"
        class="absolute inset-0 z-[5000] flex items-center justify-center bg-slate-950/90 text-slate-300"
      >
        <div class="flex flex-col items-center gap-2">
          <span class="animate-pulse text-lg font-medium">지도를 불러오는 중입니다...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  font: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

:deep(.leaflet-popup-content) {
  margin: 0;
}

:deep(.custom-pin),
:deep(.festival-pin) {
  background: transparent;
  border: none;
}
</style>