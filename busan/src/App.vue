<script setup>
import { ref } from 'vue'
import Home from './components/Home.vue'
import FestivalDetail from './components/FestivalDetail.vue'
import AllReviews from './components/AllReviews.vue'
import Chatbot from './components/Chatbot.vue'

// 💡 'home' (지도) | 'detail' (상세페이지) | 'reviews' (전체 리뷰) 세 가지 화면을 제어합니다.
const currentView = ref('home') 
const selectedFestivalId = ref('')

// 축제 상세 페이지로 이동
function goToDetail(festivalId) {
  selectedFestivalId.value = festivalId
  currentView.value = 'detail'
}

// 지도 홈 화면으로 이동
function goToHome() {
  currentView.value = 'home'
}

// 전체 리뷰 페이지로 이동
function goToReviews() {
  currentView.value = 'reviews'
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
    
    <!-- 🌟 1. 상단 고정 네비게이션 헤더 바 -->
    <header class="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 shadow-lg shadow-black/20">
      <div class="mx-auto max-w-7xl flex items-center justify-between gap-4">
        
        <!-- 로고 (클릭 시 메인 지도로 복귀) -->
        <div class="flex items-center gap-2 cursor-pointer transition active:scale-95" @click="goToHome">
          <span class="text-2xl">🌊</span>
          <span class="text-lg font-black tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            BUSAN FESTIVAL MAP
          </span>
        </div>

        <!-- 탭 네비게이션 버튼들 -->
        <nav class="flex items-center gap-2">
          <!-- 지도 탐색 탭 -->
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

          <!-- 전체 후기 탭 -->
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

    <!-- 🌟 2. 본문 뷰포트 영역 -->
    <main class="flex-1">
      
      <!-- [Home] 구별 지도 화면 -->
      <Home 
        v-if="currentView === 'home'" 
        @select-festival="goToDetail" 
      />

      <!-- [FestivalDetail] 축제 상세 정보 화면 (뒤로가기 지원) -->
      <div v-else-if="currentView === 'detail'" class="relative">
        <div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <button
            type="button"
            @click="goToHome"
            class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-white transition"
          >
            <i class="fa-solid fa-arrow-left"></i> 뒤로가기 (지도 보기)
          </button>
        </div>
        
        <FestivalDetail :festivalId="selectedFestivalId" />
      </div>

      <!-- [AllReviews] 통합 리뷰 모아보기 화면 -->
      <AllReviews 
        v-else-if="currentView === 'reviews'" 
        @select-festival="goToDetail" 
      />

    </main>

    <!-- 🌟 3. 전역 노출 챗봇 컴포넌트 -->
    <Chatbot />

  </div>
</template>