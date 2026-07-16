<script setup>
import { ref } from 'vue'
import Home from './components/Home.vue'
import FestivalDetail from './components/FestivalDetail.vue'
import AllReviews from './components/AllReviews.vue'
import FestivalCalendar from './components/FestivalCalendar.vue'
import Chatbot from './components/Chatbot.vue'

const currentView = ref('home') 
const selectedFestivalId = ref('')

function goToDetail(festivalId) {
  selectedFestivalId.value = festivalId
  currentView.value = 'detail'
}

function goToHome() {
  currentView.value = 'home'
}

function goToReviews() {
  currentView.value = 'reviews'
}

function goToCalendar() {
  currentView.value = 'calendar'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header
      class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      <div
        class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <button
          type="button"
          class="text-lg font-black tracking-tight text-sky-600"
          @click="goToHome"
        >
          BUSAN FESTIVAL MAP
        </button>

        <nav class="flex items-center gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="
              currentView === 'home' || currentView === 'detail'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            "
            @click="goToHome"
          >
            🗺️ 축제 탐색
          </button>

          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="
              currentView === 'calendar'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            "
            @click="goToCalendar"
          >
            📅 축제 일정
          </button>

          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="
              currentView === 'reviews'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            "
            @click="goToReviews"
          >
            💬 커뮤니티
          </button>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      
      <Home 
        v-if="currentView === 'home'" 
        @select-festival="goToDetail" 
      />

      <div v-else-if="currentView === 'detail'" class="relative">
        <div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <button
            type="button"
            @click="goToHome"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
          >
            <i class="fa-solid fa-arrow-left"></i> 뒤로가기 (지도 보기)
          </button>
        </div>
        
        <FestivalDetail :festivalId="selectedFestivalId" />
      </div>

      <FestivalCalendar 
        v-else-if="currentView === 'calendar'"
        @select-festival="goToDetail"
      />

      <AllReviews 
        v-else-if="currentView === 'reviews'"
        @select-festival="goToDetail"
      />
      
    </main>

    <!-- 🤖 챗봇 (모든 페이지에서 고정 표시) -->
    <Chatbot />

  </div>
</template>