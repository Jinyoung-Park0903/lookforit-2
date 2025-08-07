
class MealInfoApp {
    constructor() {
        this.apiBaseUrl = 'https://open.neis.go.kr/hub/mealServiceDietInfo';
        this.schoolCode = '7530079';
        this.officeCode = 'J10';
        
        this.initializeElements();
        this.bindEvents();
        this.setTodayDate();
    }
    
    initializeElements() {
        this.dateInput = document.getElementById('meal-date');
        this.searchBtn = document.getElementById('search-btn');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.mealContent = document.getElementById('meal-content');
        this.mealDateDisplay = document.getElementById('meal-date-display');
        this.menuList = document.getElementById('menu-list');
        this.nutritionInfo = document.getElementById('nutrition-info');
    }
    
    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchMealInfo());
        this.dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMealInfo();
            }
        });
    }
    
    setTodayDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        this.dateInput.value = formattedDate;
    }
    
    async searchMealInfo() {
        const selectedDate = this.dateInput.value;
        if (!selectedDate) {
            alert('날짜를 선택해주세요.');
            return;
        }
        
        const formattedDate = selectedDate.replace(/-/g, '');
        
        this.showLoading();
        
        try {
            const mealData = await this.fetchMealData(formattedDate);
            this.displayMealInfo(mealData, selectedDate);
        } catch (error) {
            console.error('급식 정보 조회 실패:', error);
            this.showError();
        }
    }
    
    async fetchMealData(date) {
        const url = `${this.apiBaseUrl}?ATPT_OFCDC_SC_CODE=${this.officeCode}&SD_SCHUL_CODE=${this.schoolCode}&MLSV_YMD=${date}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            return this.parseXMLData(xmlDoc);
        } catch (error) {
            throw new Error('데이터를 가져오는데 실패했습니다.');
        }
    }
    
    parseXMLData(xmlDoc) {
        const rows = xmlDoc.getElementsByTagName('row');
        
        if (rows.length === 0) {
            throw new Error('해당 날짜의 급식 정보가 없습니다.');
        }
        
        const row = rows[0];
        const dishName = this.getTextContent(row, 'DDISH_NM');
        const calorie = this.getTextContent(row, 'CAL_INFO');
        const nutrition = this.getTextContent(row, 'NTR_INFO');
        
        return {
            menu: dishName ? dishName.split('<br/>').filter(item => item.trim()) : [],
            calorie: calorie || '정보 없음',
            nutrition: nutrition ? nutrition.split('<br/>').filter(item => item.trim()) : []
        };
    }
    
    getTextContent(element, tagName) {
        const tag = element.getElementsByTagName(tagName)[0];
        return tag ? tag.textContent : '';
    }
    
    displayMealInfo(mealData, date) {
        const formattedDate = this.formatDate(date);
        this.mealDateDisplay.textContent = `${formattedDate} 급식 정보`;
        
        // 메뉴 표시
        this.menuList.innerHTML = '';
        if (mealData.menu.length > 0) {
            mealData.menu.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.replace(/\([^)]*\)/g, '').trim(); // 알레르기 정보 제거
                this.menuList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = '메뉴 정보가 없습니다.';
            this.menuList.appendChild(li);
        }
        
        // 영양 정보 표시
        this.nutritionInfo.innerHTML = '';
        
        // 칼로리 정보
        const calorieDiv = document.createElement('div');
        calorieDiv.className = 'nutrition-item';
        calorieDiv.innerHTML = `
            <span class="nutrition-label">칼로리</span>
            <span class="nutrition-value">${mealData.calorie}</span>
        `;
        this.nutritionInfo.appendChild(calorieDiv);
        
        // 기타 영양 정보
        if (mealData.nutrition.length > 0) {
            mealData.nutrition.forEach(item => {
                const nutritionDiv = document.createElement('div');
                nutritionDiv.className = 'nutrition-item';
                
                const parts = item.split(':');
                if (parts.length === 2) {
                    nutritionDiv.innerHTML = `
                        <span class="nutrition-label">${parts[0].trim()}</span>
                        <span class="nutrition-value">${parts[1].trim()}</span>
                    `;
                } else {
                    nutritionDiv.innerHTML = `
                        <span class="nutrition-label">${item}</span>
                        <span class="nutrition-value">-</span>
                    `;
                }
                this.nutritionInfo.appendChild(nutritionDiv);
            });
        }
        
        this.hideLoading();
        this.showMealContent();
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[date.getDay()];
        
        return `${year}년 ${month}월 ${day}일 (${weekday})`;
    }
    
    showLoading() {
        this.loading.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');
        this.mealContent.classList.add('hidden');
    }
    
    hideLoading() {
        this.loading.classList.add('hidden');
    }
    
    showError() {
        this.hideLoading();
        this.errorMessage.classList.remove('hidden');
        this.mealContent.classList.add('hidden');
    }
    
    showMealContent() {
        this.errorMessage.classList.add('hidden');
        this.mealContent.classList.remove('hidden');
        this.mealContent.classList.add('fade-in');
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new MealInfoApp();
});
