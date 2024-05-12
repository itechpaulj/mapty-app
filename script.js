'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Date.now() + 10;
    clicks = 0;
    constructor(coords,distance,duration){
        
        this.distance = distance; // mins
        this.duration = duration; // km
        this.coords = coords // [lat,lng]
    }

    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${months[this.date.getMonth()]} ${this.date.getDate()} ${this.type[0].toUpperCase()}${this.type.slice(1)}`
    }
    click(){
        this.clicks++;
    }
}

class Running extends Workout{
    type = 'running';
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration)
        this.cadence = cadence // km / hr
        this.calcPace();
        this._setDescription();
        this.click();
    
    }

    calcPace(){
        // min / km
        this.pace = this.duration / this.distance;
        return this.pace
    }
}

class Cycling extends Workout{
    type = 'cycling';
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration,elevationGain)
        this.elevationGain = elevationGain // km / hr
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        // km / h
        this.speed = this.duration / (this.distance / 60);
        return this.speed
    }
}

//const app1 = new Running([5,12],5.2,24,178)
//const app2 = new Cycling([5,12],6.2,27,523)
//console.log(app1,app2)
// Application Architecture
class App {
    #map
    #mapEvent
    #workouts = [];
    #zoomLevel = 13;
    constructor(){

        // get the position lalitude and longitude
        this._getPosition();

        // event listener
        form.addEventListener('submit',this._newWorkout.bind(this));
        inputType.addEventListener('change',this._toggleElevationField)
        containerWorkouts.addEventListener('click',this._zoomPopUp.bind(this))
        // getLocal Storage
        this._getLocalStorage();

    }

    _getPosition(){
        // geolocation api js mdn web
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
            alert('Could not connect the location') 
            })
        }
    }

    _loadMap(position){
      
        const lalitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        //https://www.google.com/maps/@latitude,longitude
        //https://www.google.com/maps/@14.7914752,121.012224

        const coords =  [lalitude, longitude];

        // initialize the map on the "map" div with a given center and zoom
        this.#map = L.map('map', {
            center: coords,
            zoom: this.#zoomLevel
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap Paul</a>'
        }).addTo(this.#map);


        this.#map.on('click',this._showForm.bind(this))
        this.#workouts.forEach((value,_) =>{
            this._renderWorkoutMaker(value)
        })
    }

    _showForm(mapEv) {
        this.#mapEvent = mapEv
        form.classList.remove('hidden')
        inputDistance.focus()
    }
    
    _hideForm(){
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ''
    form.style.display = 'none'
    form.classList.add('hidden')
        setTimeout(function(){
            form.style.display = 'grid'
        },1000)
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e){
        e.preventDefault();
        const isTrulyValidInput = function(...nums){
            let validInput = nums.every(function(num){
                return Number.isFinite(Number(num))
         });
     
            return validInput
        }
        const isTrulyPositiveNumber = function(...nums){
            return nums.every(function(num){
                return num > 0
            });
        }

        const lat = this.#mapEvent.latlng.lat;
        const lng = this.#mapEvent.latlng.lng;
        
        const type = inputType.value;
        const distance = Number(inputDistance.value);
        const duration = Number(inputDuration.value);
        let workouts ;
        if(type === 'running'){
            const cadence = Number(inputCadence.value);
            if(
                !isTrulyValidInput(distance,duration,cadence) || 
                !isTrulyPositiveNumber(distance,duration,cadence)
            )
           
            return alert('Input has to be a positive number!')
            workouts = new Running([lat,lng],distance,duration,cadence)
        
        }

        if(type === 'cycling'){
            const elevationGain = Number(inputElevation.value);
            if(
                !isTrulyValidInput(distance,duration,elevationGain) ||
                !isTrulyPositiveNumber(distance,duration)
                
            )
            return alert('Input has to be a positive number!')
            workouts = new Cycling([lat,lng],distance,duration,elevationGain)    
        }

        console.log('insert:', workouts)
        // other func
        this.#workouts.push(workouts)
        this._renderWorkoutMaker(workouts)
        this._renderHtmlWorkout(workouts)
        this._hideForm();
        // save local storage
        this._setLocalStorage();
 
    }
    _renderWorkoutMaker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth: 300,
                minWidth: 50,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            })
        )
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' } ${workout.description}`)
        .openPopup()
    }

    _renderHtmlWorkout(workout){
       
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">Running on ${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">
            ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }
            </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `

        if(workout.type === 'running'){
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
            </div>
        </li>
            `
        }


        if(workout.type === 'cycling'){
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
            </div>
        </li>
            `
        }
        form.insertAdjacentHTML('afterend',html)
    }

    _zoomPopUp(e){
       
        const containerEl = e.target.closest('.workout');
        
        
        if(!containerEl) return
      
        let getIdContainerEl = this.#workouts.find(function(workout){
            return workout.id === Number(containerEl.dataset.id)
        })
       
        this.#map.setView(getIdContainerEl.coords,this.#zoomLevel,{
            animate: true,
            pan: {
                duration: 1,
            }
        })

         //workouts.click();
    }
    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workouts))
    }
    _getLocalStorage(){
        let data = JSON.parse(localStorage.getItem('workouts'))
        
        if(!data) return
        this.#workouts = data;
        this.#workouts.forEach((value,_) =>{
            this._renderHtmlWorkout(value)
        })
    }
    reset(){
        localStorage.removeItem('workouts')
        location.reload();
    }

}

const app =  new App();

