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
  <div class="min-h-screen min-h-screen bg-white px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
    
    <header class="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 shadow-lg shadow-black/20">
      <div class="mx-auto max-w-7xl flex items-center justify-between gap-4">
        
        <div class="flex items-center gap-2 cursor-pointer transition active:scale-95" @click="goToHome">
          <span class="text-2xl">🌊</span>
          <span class="text-lg font-black tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            BUSAN FESTIVAL MAP
          </span>
        </div>

        <nav class="flex items-center gap-2">
          <button
            type="button"
            @click="goToHome"
            class="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200"
            :class="currentView === 'home' || currentView === 'detail'
              ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'"
          >
            🗺️ 축제 탐색
          </button>

          <button
            type="button"
            @click="goToCalendar"
            class="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200"
            :class="currentView === 'calendar'
              ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'"
          >
            📅 축제 일정
          </button>

          <button
            type="button"
            @click="goToReviews"
            class="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200"
            :class="currentView === 'reviews'
              ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'"
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
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-white transition"
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