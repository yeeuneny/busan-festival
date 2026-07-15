<script setup>
import { ref, computed, onMounted } from 'vue'
import festivalsData from '../assets/festivals.json'

const emit = defineEmits(['select-festival'])

// 🎯 기준 날짜 (오늘): 2026년 7월 15일
const TODAY = new Date(2026, 6, 15)
const todayStr = '20260715'

const currentYear = ref(TODAY.getFullYear())
const currentMonth = ref(TODAY.getMonth())
const festivalItems = ref([])

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
      dateString: dateString
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

// 축제가 진행 중인지 판정하는 함수
function isFestivalOngoing(festival) {
  if (!festival.eventstartdate || !festival.eventenddate) return false
  return festival.eventstartdate <= todayStr && festival.eventenddate >= todayStr
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
  const selectedDay = parseInt(selectedDateStr.value.substring(6, 8))
  const maxDaysInNewMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const dayToSelect = Math.min(selectedDay, maxDaysInNewMonth)
  
  const monthStr = String(currentMonth.value + 1).padStart(2, '0')
  const dayStr = String(dayToSelect).padStart(2, '0')
  selectedDateStr.value = `${currentYear.value}${monthStr}${dayStr}`
}

const selectedDateLabel = computed(() => {
  if (!selectedDateStr.value) return ''
  const year = selectedDateStr.value.substring(0, 4)
  const month = parseInt(selectedDateStr.value.substring(4, 6))
  const day = parseInt(selectedDateStr.value.substring(6, 8))
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

onMounted(() => {
  festivalItems.value = festivalsData?.items ?? []
})
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 px-4 py-10 text-slate-800 sm:px-6 lg:px-8 font-sans">
    <div class="mx-auto max-w-5xl space-y-8">
      
      <!-- 🌟 상단 헤더 영역 -->
      <div class="flex items-end justify-between px-1">
        <div class="space-y-1">
          <p class="text-sm font-bold text-slate-900 tracking-tight">월별 축제 달력</p>
          <h1 class="text-4xl font-extrabold text-indigo-600 tracking-tight font-mono">
            {{ currentYear }}.{{ String(currentMonth + 1).padStart(2, '0') }}
          </h1>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="prevMonth" 
            type="button" 
            class="w-8 h-8 flex items-center justify-center rounded-full border border-indigo-300 hover:border-indigo-600 text-indigo-500 hover:bg-indigo-50 transition"
          >
            ⊖
          </button>
          <button 
            @click="nextMonth" 
            type="button" 
            class="w-8 h-8 flex items-center justify-center rounded-full border border-indigo-300 hover:border-indigo-600 text-indigo-500 hover:bg-indigo-50 transition"
          >
            ⊕
          </button>
        </div>
      </div>

      <!-- 🌟 메인 달력 -->
      <div class="rounded-2xl border border-indigo-500 bg-white overflow-hidden shadow-sm">
        
        <!-- 요일 헤더 -->
        <div class="grid grid-cols-7 border-b border-slate-200 bg-white text-center text-sm font-bold py-3.5 text-slate-700">
          <div v-for="(day, idx) in weekdays" :key="day" :class="{ 'text-rose-500': idx === 0, 'text-blue-500': idx === 6 }">
            {{ day }}
          </div>
        </div>

        <!-- 날짜 그리드 -->
        <div class="grid grid-cols-7 border-slate-200 divide-y divide-slate-100">
          <div
            v-for="(cell, index) in calendarCells"
            :key="index"
            @click="handleDayClick(cell.dateString)"
            class="h-24 p-1.5 flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer group"
            :class="[
              index >= 7 ? 'border-t border-slate-100' : '',
              cell.dateString && selectedDateStr === cell.dateString 
                ? 'bg-indigo-600 text-white rounded-xl scale-[0.96] z-10 shadow-md shadow-indigo-600/20' 
                : 'bg-white text-slate-800 hover:bg-slate-50'
            ]"
          >
            <template v-if="cell.dayNum">
              <span 
                class="text-lg font-bold font-mono block"
                :class="[
                  selectedDateStr === cell.dateString ? 'text-white' : (
                    index % 7 === 0 ? 'text-rose-500' : (index % 7 === 6 ? 'text-blue-500' : 'text-slate-900')
                  )
                ]"
              >
                {{ cell.dayNum }}
              </span>
              
              <div 
                class="text-[10px] mt-1 flex flex-col items-center gap-0.5"
                :class="selectedDateStr === cell.dateString ? 'text-indigo-100' : 'text-slate-400 font-medium'"
              >
                <span>{{ getFestivalsForDay(cell.dateString).length }}개</span>
                <span class="text-[8px] font-light leading-none -mt-0.5">v</span>
              </div>
            </template>
          </div>
        </div>

      </div>

      <!-- 🌟 선택된 날짜의 축제 리스트 (카드 형태) -->
      <div v-if="getFestivalsForDay(selectedDateStr).length > 0" class="space-y-4">
        <div class="flex items-center gap-2 px-1">
          <h2 class="text-lg font-black text-slate-900">축제 리스트</h2>
          <span class="text-sm font-bold text-indigo-600">{{ selectedDateLabel }}</span>
        </div>

        <!-- 축제 카드 그리드 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="festival in getFestivalsForDay(selectedDateStr)"
            :key="festival.contentid"
            @click="goToDetail(festival.contentid)"
            class="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-indigo-300 transition duration-200 cursor-pointer group"
          >
            <!-- 축제 이미지 -->
            <div class="relative h-40 bg-slate-200 overflow-hidden">
              <img 
                v-if="festival.firstimage || festival.firstimage2"
                :src="festival.firstimage || festival.firstimage2"
                :alt="festival.title"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-white text-sm">
                No Image
              </div>

              <!-- 진행중 배지 (현재 진행 중인 행사에만 표시) -->
              <div 
                v-if="isFestivalOngoing(festival)"
                class="absolute top-2 right-2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse"
              >
                🟢 진행중
              </div>
            </div>

            <!-- 축제 정보 -->
            <div class="p-4 space-y-2">
              <!-- 축제 제목 -->
              <h3 class="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition">
                {{ festival.title }}
              </h3>

              <!-- 기간 -->
              <p class="text-xs text-slate-500 font-medium">
                📅 {{ formatDateRange(festival.eventstartdate, festival.eventenddate) }}
              </p>

              <!-- 장소 -->
              <p class="text-xs text-slate-600 line-clamp-1">
                📍 {{ festival.eventplace || festival.addr1 || '장소 정보 없음' }}
              </p>

              <!-- 상세보기 버튼 -->
              <button
                @click.stop="goToDetail(festival.contentid)"
                class="w-full mt-3 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs rounded-lg transition"
              >
                상세보기 →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 메시지 -->
      <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-3">
        <p class="text-3xl">📅</p>
        <p class="text-sm font-semibold text-slate-600">{{ selectedDateLabel }}에 예정된 축제가 없습니다.</p>
        <p class="text-xs text-slate-500">다른 날짜를 선택해보세요!</p>
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