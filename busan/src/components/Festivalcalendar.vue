<script setup>
import { ref, computed, onMounted } from 'vue'
import festivalsData from '../assets/festivals.json'

const emit = defineEmits(['select-festival'])

const TODAY = new Date(2026, 6, 15)
const todayStr = '20260715'

const currentYear = ref(TODAY.getFullYear())
const currentMonth = ref(TODAY.getMonth())
const festivalItems = ref([])

const isAllView = ref(false)
const currentCategoryFilter = ref('all')

const selectedDateStr = ref(
  `${TODAY.getFullYear()}${String(TODAY.getMonth() + 1).padStart(2, '0')}${String(TODAY.getDate()).padStart(2, '0')}`
)

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfWeek = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const calendarCells = computed(() => {
  const cells = []

  for (let i = 0; i < firstDayOfWeek.value; i++) {
    cells.push({ dayNum: '', dateString: '' })
  }

  for (let day = 1; day <= daysInMonth.value; day++) {
    const monthStr = String(currentMonth.value + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateString = `${currentYear.value}${monthStr}${dayStr}`

    cells.push({
      dayNum: day,
      dateString
    })
  }

  return cells
})

function getFestivalsForDay(dateString) {
  if (!dateString) return []
  return festivalItems.value.filter(item => {
    if (!item.eventstartdate || !item.eventenddate) return false
    return item.eventstartdate <= dateString && item.eventenddate >= dateString
  })
}

function isFestivalOngoing(festival) {
  if (!festival.eventstartdate || !festival.eventenddate) return false
  return festival.eventstartdate <= todayStr && festival.eventenddate >= todayStr
}

function isFestivalUpcoming(festival) {
  if (!festival.eventstartdate) return false
  return festival.eventstartdate > todayStr
}

function isFestivalEnded(festival) {
  if (!festival.eventenddate) return false
  return festival.eventenddate < todayStr
}

function getFestivalBadge(festival) {
  if (isFestivalOngoing(festival)) return { text: '🟢 진행중', class: 'bg-emerald-500' }
  if (isFestivalUpcoming(festival)) return { text: '🔵 진행예정', class: 'bg-sky-500' }
  return { text: '⚪ 종료된 행사', class: 'bg-slate-400' }
}

function handleDayClick(dateString) {
  if (!dateString) return
  selectedDateStr.value = dateString
}

function goToDetail(contentid) {
  emit('select-festival', String(contentid))
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }

  updateSelectedDateForMonth()
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }

  updateSelectedDateForMonth()
}

function updateSelectedDateForMonth() {
  const selectedDay = parseInt(selectedDateStr.value.substring(6, 8), 10)
  const maxDaysInNewMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const dayToSelect = Math.min(selectedDay, maxDaysInNewMonth)

  const monthStr = String(currentMonth.value + 1).padStart(2, '0')
  const dayStr = String(dayToSelect).padStart(2, '0')
  selectedDateStr.value = `${currentYear.value}${monthStr}${dayStr}`
}

const selectedDateLabel = computed(() => {
  if (!selectedDateStr.value) return ''
  const year = selectedDateStr.value.substring(0, 4)
  const month = parseInt(selectedDateStr.value.substring(4, 6), 10)
  const day = parseInt(selectedDateStr.value.substring(6, 8), 10)
  return `${year}년 ${month}월 ${day}일`
})

function formatDateRange(startDate, endDate) {
  const formatDate = (dateStr) => {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}.${month}.${day}`
  }
  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`
}

const filteredAndSortedAllFestivals = computed(() => {
  const ongoingList = festivalItems.value.filter(isFestivalOngoing)
  const upcomingList = festivalItems.value.filter(isFestivalUpcoming)
  const endedList = festivalItems.value.filter(isFestivalEnded)

  const compareByStartDate = (a, b) => {
    if (a.eventstartdate !== b.eventstartdate) return a.eventstartdate.localeCompare(b.eventstartdate)
    return (a.title || '').localeCompare(b.title || '')
  }

  const compareByEndDateDesc = (a, b) => {
    if (a.eventenddate !== b.eventenddate) return b.eventenddate.localeCompare(a.eventenddate)
    return (a.title || '').localeCompare(b.title || '')
  }

  const sortedOngoing = [...ongoingList].sort(compareByStartDate)
  const sortedUpcoming = [...upcomingList].sort(compareByStartDate)
  const sortedEnded = [...endedList].sort(compareByEndDateDesc)

  if (currentCategoryFilter.value === 'ongoing') return sortedOngoing
  if (currentCategoryFilter.value === 'upcoming') return sortedUpcoming
  if (currentCategoryFilter.value === 'ended') return sortedEnded

  return [...sortedOngoing, ...sortedUpcoming, ...sortedEnded]
})

onMounted(() => {
  festivalItems.value = festivalsData?.items ?? []
})
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 px-4 py-10 text-slate-800 sm:px-6 lg:px-8 font-sans select-none">
    <div class="mx-auto max-w-5xl space-y-8">
      <div class="flex items-end justify-between px-1 border-b border-slate-200/60 pb-4">
        <div class="space-y-1">
          <p class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            📅 월별 축제 달력
          </p>
          <h1 class="text-2xl font-extrabold text-sky-500 tracking-tight font-mono">
            {{ currentYear }}.{{ String(currentMonth + 1).padStart(2, '0') }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="prevMonth"
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-full border border-sky-500 hover:border-sky-500 text-sky-500 hover:bg-sky-50 transition"
          >
            ⊖
          </button>

          <button
            @click="nextMonth"
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-full border border-sky-500 hover:border-sky-500 text-sky-500 hover:bg-sky-50 transition"
          >
            ⊕
          </button>

          <button
            type="button"
            @click="isAllView = !isAllView"
            class="ml-2 px-4 py-1.5 rounded-full text-xs font-bold border transition duration-150"
            :class="isAllView
              ? 'bg-sky-500 text-slate-900 border-sky-500 shadow-md shadow-sky-500/20'
              : 'bg-white text-sky-600 border-sky-300 hover:bg-sky-100'"
          >
            {{ isAllView ? '📅 달력 보기' : '📋 전체 축제 목록' }}
          </button>
        </div>
      </div>

      <div v-if="!isAllView" class="space-y-8">
        <div class="rounded-2xl border border-sky-500 bg-white overflow-hidden shadow-sm">
          <div class="grid grid-cols-7 border-b border-slate-200 bg-white text-center text-sm font-bold py-3.5 text-slate-700">
            <div v-for="(day, idx) in weekdays" :key="day" :class="{ 'text-rose-500': idx === 0, 'text-blue-500': idx === 6 }">
              {{ day }}
            </div>
          </div>

          <div class="grid grid-cols-7 border-slate-200 divide-y divide-slate-100">
            <div
              v-for="(cell, index) in calendarCells"
              :key="index"
              @click="handleDayClick(cell.dateString)"
              class="h-24 p-1.5 flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer group"
              :class="[
                index >= 7 ? 'border-t border-slate-100' : '',
                cell.dateString && selectedDateStr === cell.dateString
                  ? 'bg-sky-500 text-slate-900 rounded-xl scale-[0.96] z-10 shadow-md shadow-sky-500/20'
                  : 'bg-white text-slate-800 hover:bg-slate-50'
              ]"
            >
              <template v-if="cell.dayNum">
                <span
                  class="text-lg font-bold font-mono block"
                  :class="[
                    selectedDateStr === cell.dateString ? 'text-slate-900' : (
                      index % 7 === 0 ? 'text-rose-500' : (index % 7 === 6 ? 'text-blue-500' : 'text-slate-900')
                    )
                  ]"
                >
                  {{ cell.dayNum }}
                </span>

                <div
                  class="text-[10px] mt-1 flex flex-col items-center gap-0.5"
                  :class="selectedDateStr === cell.dateString ? 'text-sky-100' : 'text-slate-400 font-medium'"
                >
                  <span>{{ getFestivalsForDay(cell.dateString).length }}개</span>
                  <span class="text-[8px] font-light leading-none -mt-0.5">v</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div v-if="getFestivalsForDay(selectedDateStr).length > 0" class="space-y-4">
          <div class="flex items-center gap-2 px-1">
            <h2 class="text-lg font-black text-slate-900">축제 리스트</h2>
            <span class="text-sm font-bold text-sky-500">{{ selectedDateLabel }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="festival in getFestivalsForDay(selectedDateStr)"
              :key="festival.contentid"
              @click="goToDetail(festival.contentid)"
              class="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-sky-300 transition duration-200 cursor-pointer group"
            >
              <div class="relative h-40 bg-slate-200 overflow-hidden">
                <img
                  v-if="festival.firstimage || festival.firstimage2"
                  :src="festival.firstimage || festival.firstimage2"
                  :alt="festival.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 text-sm">
                  No Image
                </div>

                <div
                  v-if="isFestivalOngoing(festival)"
                  class="absolute top-2 right-2 px-3 py-1 bg-emerald-500 text-slate-900 text-xs font-bold rounded-full shadow-lg animate-pulse"
                >
                  🟢 진행중
                </div>
              </div>

              <div class="p-4 space-y-2">
                <h3 class="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-sky-500 transition">
                  {{ festival.title }}
                </h3>
                <p class="text-xs text-slate-500 font-medium">
                  📅 {{ formatDateRange(festival.eventstartdate, festival.eventenddate) }}
                </p>
                <p class="text-xs text-slate-600 line-clamp-1">
                  📍 {{ festival.eventplace || festival.addr1 || '장소 정보 없음' }}
                </p>

                <button
                  @click.stop="goToDetail(festival.contentid)"
                  class="w-full mt-3 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-600 font-semibold text-xs rounded-lg transition"
                >
                  상세보기 →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-3">
          <p class="text-3xl">📅</p>
          <p class="text-sm font-semibold text-slate-600">{{ selectedDateLabel }}에 예정된 축제가 없습니다.</p>
          <p class="text-xs text-slate-500">다른 날짜를 선택해보세요!</p>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            📋 부산 축제 전체 타임라인
            <span class="text-xs font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-md font-mono">
              총 {{ filteredAndSortedAllFestivals.length }}개
            </span>
          </h2>

          <div class="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold w-fit self-end sm:self-auto shadow-inner">
            <button
              @click="currentCategoryFilter = 'all'"
              type="button"
              class="px-3 py-1.5 rounded-lg transition"
              :class="currentCategoryFilter === 'all' ? 'bg-sky-600 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            >
              전체 보기
            </button>
            <button
              @click="currentCategoryFilter = 'ongoing'"
              type="button"
              class="px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              :class="currentCategoryFilter === 'ongoing' ? 'bg-sky-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            >
              🟢 진행중
            </button>
            <button
              @click="currentCategoryFilter = 'upcoming'"
              type="button"
              class="px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              :class="currentCategoryFilter === 'upcoming' ? 'bg-sky-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            >
              🔵 진행예정
            </button>
            <button
              @click="currentCategoryFilter = 'ended'"
              type="button"
              class="px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              :class="currentCategoryFilter === 'ended' ? 'bg-sky-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            >
              ⚪ 종료
            </button>
          </div>
        </div>

        <div v-if="filteredAndSortedAllFestivals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="festival in filteredAndSortedAllFestivals"
            :key="festival.contentid"
            @click="goToDetail(festival.contentid)"
            class="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl hover:border-sky-400 transition duration-300 cursor-pointer flex flex-col group"
          >
            <div class="relative h-44 bg-slate-100 overflow-hidden shrink-0">
              <img
                v-if="festival.firstimage || festival.firstimage2"
                :src="festival.firstimage || festival.firstimage2"
                :alt="festival.title"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">
                이미지 준비중
              </div>

              <div
                class="absolute top-2.5 right-2.5 px-2.5 py-1 text-slate-900 text-[10px] font-black rounded-md shadow-md"
                :class="getFestivalBadge(festival).class"
              >
                {{ getFestivalBadge(festival).text }}
              </div>
            </div>

            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div class="space-y-1.5">
                <h3 class="font-extrabold text-sm text-slate-900 group-hover:text-sky-500 transition line-clamp-1">
                  {{ festival.title }}
                </h3>
                <p class="text-xs font-bold text-sky-500 font-mono tracking-tight">
                  📅 {{ formatDateRange(festival.eventstartdate, festival.eventenddate) }}
                </p>
              </div>
              <p class="text-xs text-slate-400 line-clamp-1 border-t border-slate-100 pt-2 flex items-center gap-1">
                📍 {{ festival.eventplace || festival.addr1 || '장소 정보 없음' }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="rounded-3xl border border-dashed border-slate-200 bg-slate-50/40 p-20 text-center text-slate-400">
          <span class="text-4xl block mb-2">🔍</span>
          <p class="text-sm font-bold">조건에 해당하는 행사 목록이 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>